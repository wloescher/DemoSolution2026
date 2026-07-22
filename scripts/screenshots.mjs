/**
 * Capture a screenshot of every page in each Presentation front-end.
 *
 *   npm run screenshots                 # every project
 *   npm run screenshots -- DemoReact    # one project (repeatable)
 *
 * Each project's dev server is started, captured, and stopped in turn. Images land in
 * Documentation/ as <ProjectName>-<PageName>.png.
 *
 * No Web API or SQL Server is needed: DemoReact and DemoAngular both ship client-side dummy auth
 * and inline test data, so every route renders standalone once the login form is submitted.
 *
 * Expect a few images to differ on every run even when nothing changed:
 *   - <project>-Weather.png  — the Blazor scaffold generates random forecasts (Random.Shared).
 *   - <project>-Error.png    — prints a per-request Activity id / TraceIdentifier.
 * Other pages can drift by a handful of bytes from caret and antialiasing noise. Review the diff
 * before committing regenerated images; discarding a no-op change is usually the right call.
 *
 * Overrides:
 *   DOTNET=/path/to/dotnet    .NET host (default: ~/.dotnet/dotnet if present, else `dotnet`)
 *   CHROME=/path/to/chrome    Chrome binary (default: the macOS Google Chrome bundle)
 */
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'Documentation');

const DEFAULT_DOTNET = existsSync(path.join(homedir(), '.dotnet/dotnet'))
    ? path.join(homedir(), '.dotnet/dotnet')
    : 'dotnet';
const DOTNET = process.env.DOTNET || DEFAULT_DOTNET;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// --- page lists ------------------------------------------------------------------------------

// DemoBlazor, DemoMudBlazor, and DemoRazor are still default scaffolds.
const BLAZOR_PAGES = [
    ['Home', '/'],
    ['Counter', '/counter'],
    ['Weather', '/weather'],
    ['Error', '/Error'],
];

// DemoReact and DemoAngular expose the same CRUD shape over three entities, but spell the edit
// route differently (/client/1/edit vs /client/edit/1), so the edit path is a parameter.
const crudPages = (label, pluralPath, singular, id, editPath) => [
    [`${label}List`, `/${pluralPath}`],
    [`${label}Detail`, `/${singular}/${id}`],
    [`${label}Edit`, editPath(singular, id)],
    [`${label}Add`, `/${singular}/add`],
];

// Ids that exist in each front-end's inline test data.
const crudSuite = (editPath) => [
    ...crudPages('Client', 'clients', 'client', 1, editPath),
    ...crudPages('User', 'users', 'user', 3, editPath),
    ...crudPages('WorkItem', 'workitems', 'workitem', 2, editPath),
];

// --- projects --------------------------------------------------------------------------------

const PROJECTS = {
    DemoBlazor: {
        base: 'http://localhost:5139',
        server: { cmd: DOTNET, args: ['run', '--project', 'Presentation/DemoBlazor', '--launch-profile', 'http'] },
        pages: BLAZOR_PAGES,
    },
    DemoMudBlazor: {
        base: 'http://localhost:5150',
        server: { cmd: DOTNET, args: ['run', '--project', 'Presentation/DemoMudBlazor', '--launch-profile', 'http'] },
        pages: BLAZOR_PAGES,
    },
    DemoRazor: {
        base: 'http://localhost:5216',
        server: { cmd: DOTNET, args: ['run', '--project', 'Presentation/DemoRazor', '--launch-profile', 'http'] },
        pages: [
            ['Index', '/'],
            ['Privacy', '/Privacy'],
            ['Error', '/Error'],
        ],
    },
    DemoVue: {
        base: 'http://localhost:50400',
        server: { cmd: 'npm', args: ['run', '--prefix', 'Presentation/DemoVue', 'dev'], nodeProject: 'Presentation/DemoVue' },
        pages: [['Home', '/']],
    },
    DemoReact: {
        base: 'http://localhost:64940',
        server: { cmd: 'npm', args: ['run', '--prefix', 'Presentation/DemoReact', 'dev'], nodeProject: 'Presentation/DemoReact' },
        login: { path: '/login', user: 'admin', pass: 'admin' },
        pages: [
            ['Login', '/login', { preLogin: true }],
            ['Home', '/'],
            ...crudSuite((s, i) => `/${s}/${i}/edit`),
            ['AccessDenied', '/accessdenied'],
            ['RouteNotFound', '/no-such-page'],
            ['Logout', '/logout'],
        ],
    },
    DemoAngular: {
        base: 'http://127.0.0.1:50395',
        server: { cmd: 'npm', args: ['start', '--prefix', 'Presentation/DemoAngular'], nodeProject: 'Presentation/DemoAngular' },
        login: { path: '/login', user: 'admin', pass: 'admin' },
        pages: [
            ['Login', '/login', { preLogin: true }],
            ['Home', '/home'],
            ...crudSuite((s, i) => `/${s}/edit/${i}`),
            ['AccessDenied', '/access-denied'],
            ['Error', '/error'],
            ['Logout', '/logout'],
        ],
    },
};

// --- helpers ---------------------------------------------------------------------------------

/**
 * The single duration formatter — used for both the ETA and the completion total.
 *   < 60s -> "45s"   < 60m -> "2m 7s"   < 24h -> "1h 4m 9s"   else -> "1d 2h 3m 4s"
 */
function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    if (s < 60) return `${seconds}s`;
    if (s < 3600) return `${minutes}m ${seconds}s`;
    if (s < 86400) return `${hours}h ${minutes}m ${seconds}s`;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Poll the server root until it answers, so we never screenshot a half-started app. */
async function waitForServer(base, timeoutMs = 180000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            await fetch(base, { signal: AbortSignal.timeout(4000) });
            return;
        } catch {
            await sleep(500);
        }
    }
    throw new Error(`Server at ${base} did not come up within ${formatDuration(timeoutMs / 1000)}`);
}

/** Start a dev server in its own process group so the whole tree can be torn down afterwards. */
async function startServer({ cmd, args }, base) {
    const child = spawn(cmd, args, { cwd: ROOT, detached: true, stdio: 'ignore' });
    child.on('error', (e) => {
        throw new Error(`Failed to launch "${cmd}": ${e.message}`);
    });
    await waitForServer(base);
    return child;
}

function stopServer(child) {
    if (!child || child.exitCode !== null) return;
    try {
        process.kill(-child.pid, 'SIGTERM'); // negative pid => the whole process group
    } catch {
        /* already gone */
    }
}

async function settle(page) {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(700);
}

// --- capture ---------------------------------------------------------------------------------

async function capture(name, project, browser, progress) {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        colorScheme: 'light',
    });
    const page = await context.newPage();

    let loggedIn = false;
    const failures = [];

    for (const [label, route, opts = {}] of project.pages) {
        // Log in once, immediately before the first page that needs an authenticated session.
        if (project.login && !loggedIn && !opts.preLogin) {
            await page.goto(project.base + project.login.path, { waitUntil: 'domcontentloaded' });
            await settle(page);
            await page.fill('#username', project.login.user);
            await page.fill('#password', project.login.pass);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(1500);
            loggedIn = true;
        }

        const file = path.join(OUT_DIR, `${name}-${label}.png`);
        try {
            await page.goto(project.base + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await settle(page);
            await page.screenshot({ path: file, fullPage: true });
            console.log(`  ${path.basename(file)}`);
        } catch (e) {
            failures.push(`${name}-${label}: ${e.message.split('\n')[0]}`);
            console.log(`  ${path.basename(file)}  FAILED`);
        }
        progress.tick();
    }

    await context.close();
    return failures;
}

// --- main ------------------------------------------------------------------------------------

async function main() {
    const requested = process.argv.slice(2);
    const unknown = requested.filter((n) => !PROJECTS[n]);
    if (unknown.length) {
        console.error(`Unknown project(s): ${unknown.join(', ')}`);
        console.error(`Known: ${Object.keys(PROJECTS).join(', ')}`);
        process.exit(1);
    }
    const names = requested.length ? requested : Object.keys(PROJECTS);

    if (!existsSync(CHROME)) {
        console.error(`Chrome not found at ${CHROME} — set CHROME=/path/to/chrome`);
        process.exit(1);
    }

    // Fail before starting anything if a front-end has no dependencies installed.
    const missingDeps = names
        .map((n) => PROJECTS[n].server.nodeProject)
        .filter((p) => p && !existsSync(path.join(ROOT, p, 'node_modules')));
    if (missingDeps.length) {
        console.error('Missing node_modules — install first:');
        for (const p of missingDeps) console.error(`  npm install --prefix ${p}`);
        process.exit(1);
    }

    const totalPages = names.reduce((sum, n) => sum + PROJECTS[n].pages.length, 0);
    const startedAt = Date.now();
    let done = 0;

    const progress = {
        tick() {
            done += 1;
            const elapsed = (Date.now() - startedAt) / 1000;
            const remaining = ((elapsed / done) * (totalPages - done));
            if (done < totalPages) {
                process.stdout.write(
                    `  ${done}/${totalPages} pages  ~${formatDuration(remaining)} remaining\n`
                );
            }
        },
    };

    console.log(`Capturing ${plural(totalPages, 'page')} across ${plural(names.length, 'project')} -> Documentation/\n`);

    const browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const allFailures = [];

    try {
        for (const name of names) {
            const project = PROJECTS[name];
            console.log(`${name} (${plural(project.pages.length, 'page')})`);
            let server;
            try {
                server = await startServer(project.server, project.base);
                allFailures.push(...(await capture(name, project, browser, progress)));
            } catch (e) {
                allFailures.push(`${name}: ${e.message}`);
                console.log(`  server failed: ${e.message}`);
                // Still advance the bar so the ETA stays honest when a whole project is skipped.
                for (let i = 0; i < project.pages.length; i++) progress.tick();
            } finally {
                stopServer(server);
            }
            console.log('');
        }
    } finally {
        await browser.close();
    }

    const total = formatDuration((Date.now() - startedAt) / 1000);
    if (allFailures.length) {
        console.log(`Done with errors. Captured: ${totalPages - allFailures.length}/${totalPages} (${total})`);
        for (const f of allFailures) console.log(`  ${f}`);
        process.exit(1);
    }
    console.log(`Done. Captured: ${totalPages} (${total})`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
