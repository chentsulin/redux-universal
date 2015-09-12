import thenify from "thenify";
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import React from "react";
import {Provider} from "react-redux";
import { RoutingContext, match } from "react-router";
import {createLocation} from "history";
import qs from "qs";

import {ActionTypes} from "./constants";
import * as reducers from "./reducers";
import loggerMiddleware from "./middleware/logger";
import HtmlDocument from "./components/HtmlDocument";

const matchRoute = thenify(match);

const extraMiddlewares = [
];
if (process.env.DEBUG) {
  extraMiddlewares.push(loggerMiddleware);
}

export function createHtmlResponse ({
  webpackStats,
  request,
}) {
  const initialState = {
    AppReducer: {
      status: 200,
      //
      title: "Redux-Universal",
      fullTitle: "Redux-Universal",
      // For server-rendering, we should load data so set it to true.
      // The trick is only set it to false when ActionTypes.DEHYDRATE is triggered.
      fetchForServerRendering: true,
    },
  };

  const reducer = combineReducers(reducers);
  const finalCreateStore = applyMiddleware(thunkMiddleware, ...extraMiddlewares)(createStore);
  const store = finalCreateStore(reducer, initialState);

  const routes = require("./routes")(store);
  const location = createLocation(
    request.query ? request.path : `${request.path}?${qs.stringify(request.query)}`
  );

  return matchRoute({ routes, location }).then(([ redirectLocation, renderProps ]) => {
    if (redirectLocation) {
      return {
        status: 302,
        pathname: redirectLocation.pathname + redirectLocation.search,
      };
    }

    if (null == renderProps) {
      return {
        status: 404,
      };
    }

    const markup = React.renderToString(
      <Provider store={store}>
        {() => <RoutingContext {...renderProps} />}
      </Provider>
    );

    store.dispatch({ type: ActionTypes.DEHYDRATE });
    const state = store.getState();

    const html = React.renderToStaticMarkup(
      <HtmlDocument
        state={state}
        markup={markup}
        webpackStats={webpackStats} />
    );

    return {
      status: state.AppReducer.status,
      body: `<!DOCTYPE html>${ html }`,
    };
  }, err => ({
    status: 500,
    body: `<!DOCTYPE html>${ err.message }`,
  }));
}
