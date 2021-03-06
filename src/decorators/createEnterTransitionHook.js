import React from "react";

export default function createEnterTransitionHook (
  transitionHookCreator
): (DecoratedComponent: React.Component) => React.Component {

  return DecoratedComponent =>
  class OnEnterDecorator extends React.Component {

    static displayName = `OnEnterDecorator(${DecoratedComponent.displayName || DecoratedComponent.name || "Component"})`;
    static DecoratedComponent = DecoratedComponent;

    static onEnterCreator = (store) => {
      const hook = transitionHookCreator(store);
      return (state, transition, callback) => {
        const promise = hook(state, transition);
        if (promise && promise.then) {
          promise.then(() => callback(), callback);
        } else {
          callback();
        }
      };
    }

    render () {
      return (
        <DecoratedComponent {...this.props} />
      );
    }
  };
}
