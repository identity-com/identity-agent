// Used to wire functions
// See https://github.com/inversify/InversifyJS/blob/master/wiki/recipes.md
import { Container } from 'inversify';
import { interfaces } from 'inversify/dts/interfaces/interfaces';

type FuncType<T> = (...args: any[]) => T;
export const bind = <T>(
  container: Container,
  func: FuncType<T>,
  dependencies: any
): FuncType<T> => {
  const injections = dependencies.map((dependency: any) =>
    container.get(dependency)
  );
  return func.bind(func, ...injections);
};

export const bindIfAbsent = <T>(
  container: Container,
  serviceIdentifier: interfaces.ServiceIdentifier<T>
): interfaces.BindingToSyntax<T> | undefined => {
  if (container.isBound(serviceIdentifier)) return;
  return container.bind<T>(serviceIdentifier);
};
