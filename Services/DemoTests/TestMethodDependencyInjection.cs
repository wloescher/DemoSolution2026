using DemoTests.BaseClasses;
using Microsoft.Extensions.DependencyInjection;

namespace DemoTests
{
    // https://medium.com/@lopezm.didac/how-to-use-dependency-injection-with-mstest-in-3-steps-8d705ea96411

    internal class TestMethodDependencyInjection : TestMethodAttribute
    {
        // MSTest 4.x migrated the extensibility surface to async: Execute -> ExecuteAsync
        // (Task<TestResult[]>) and ITestMethod.Invoke -> InvokeAsync (Task<TestResult>).
        public override async Task<TestResult[]> ExecuteAsync(ITestMethod testMethod)
        {
            var nParameters = testMethod.ParameterTypes?.Length ?? 0;
            if (nParameters != 0)
            {
                object?[] injectedArgs = new object[nParameters];
                var serviceProvider = TestBase._serviceProvider;
                using (var scope = serviceProvider!.CreateScope())
                {
                    for (var i = 0; i < nParameters; i++)
                    {
                        injectedArgs[i] = scope.ServiceProvider.GetService(testMethod.ParameterTypes![i].ParameterType)!;
                    }
                }
                return [await testMethod.InvokeAsync(injectedArgs!)];
            }
            else
            {
                return await base.ExecuteAsync(testMethod);
            }
        }
    }
}
