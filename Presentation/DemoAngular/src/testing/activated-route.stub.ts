import { Provider } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

/**
 * An ActivatedRoute carrying real route parameters, overriding the empty one RouterTestingModule
 * installs.
 *
 * The detail components resolve their entity in ngOnInit from the `id` param and their template
 * dereferences the result, so with no param they look up id 0, get `undefined` back, and throw
 * during change detection. Pass an id that exists in the service's inline test data.
 *
 *   providers: [provideActivatedRouteStub({ id: '1' })]
 */
export function provideActivatedRouteStub(params: Record<string, string>): Provider {
    const paramMap = convertToParamMap(params);
    return {
        provide: ActivatedRoute,
        useValue: {
            paramMap: of(paramMap),
            snapshot: { paramMap },
        },
    };
}
