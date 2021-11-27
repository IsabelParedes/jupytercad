
import initOpenCascade, { OpenCascadeInstance } from 'opencascade.js';
import {
  WorkerAction,
  IWorkerMessage,
  MainAction,
  IMainMessage
} from '../types';
import WorkerHandler from './actions';

// const workerHandler: { [key: string]: () => void } = {};
const sendToMain = (msg: IMainMessage) => {
  self.postMessage(msg);
};

let occ: OpenCascadeInstance;

self.onmessage = async (event: MessageEvent): Promise<void> => {
  if (!occ) {
    occ = await initOpenCascade();
    (self as any).occ = occ;
    console.log('initialized occ');
  }
  const message = event.data as IWorkerMessage;
  const { action, payload } = message;
  switch (action) {
    case WorkerAction.LOAD_FILE: {
      const result = WorkerHandler[action](payload);
      sendToMain({
        action: MainAction.DISPLAY_SHAPE,
        payload: { content: result }
      });
      break;
    }
    case WorkerAction.SAVE_FILE: {
      console.log(payload);
      break;
    }
  }

  // const fileText = model.toString();
  // const fileName = 'file.stp';
};
