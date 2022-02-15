import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setRocketCrab } from './reducer.jsx';
import { selectRocketCrab } from './selectors.jsx';

export const useRocketCrab = () => useSelector(selectRocketCrab);

export const useRocketCrabDetector = () => {
  const { rocketcrab, ishost, name } = useSearchParams();
  const dispatch = useDispatch();
  useEffect(() => {
    if (rocketcrab === 'true') dispatch(setRocketCrab(name, ishost === 'true'));
  }, []);
};
