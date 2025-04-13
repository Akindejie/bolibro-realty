'use client';

import { useRef, useEffect } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import globalReducer from '@/state';
import { api } from '@/state/api';
import userReducer, { rehydrationComplete } from '@/state/userSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react';

/* REDUX PERSIST CONFIG */
const userPersistConfig = {
  key: 'user',
  storage,
  blacklist: ['loading'], // Don't persist loading state
};

/* REDUX STORE */
const rootReducer = combineReducers({
  global: globalReducer,
  user: persistReducer(userPersistConfig, userReducer),
  [api.reducerPath]: api.reducer,
});

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(api.middleware),
  });
};

/* REDUX TYPES */
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* PROVIDER */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  const persistor = persistStore(storeRef.current);

  // Custom loading component for PersistGate that ensures loading states are reset
  const PersistLoading = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
      return () => {
        // When the loading component unmounts (rehydration complete), dispatch the action
        dispatch(rehydrationComplete());
      };
    }, [dispatch]);

    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  };

  return (
    <Provider store={storeRef.current}>
      <PersistGate
        loading={<PersistLoading />}
        persistor={persistor}
        onBeforeLift={() => {
          // Force reset loading state before lifting the gate
          storeRef.current?.dispatch(rehydrationComplete());
        }}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
