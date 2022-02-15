import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConnected } from './reducer.jsx';
import { selectConnected, selectDisconnected } from './selectors';
import { socket } from './socket.jsx';

export const useConnected = () => useSelector(selectConnected);
export const useDisconnected = () => useSelector(selectDisconnected);

export const useSocketMonitor = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    if (socket.connected) setConnected(true);
  }, []);
  useIO(
    'connect',
    useCallback(() => dispatch(setConnected(true)), [])
  );
  useIO(
    'disconnect',
    useCallback(() => dispatch(setConnected(false)), [])
  );
};

export const useIO = (name, callback) => {
  useEffect(() => {
    socket.on(name, callback);
    return () => socket.off(name, callback);
  }, [name, callback]);
};
