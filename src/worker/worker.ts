import initOpenCascade, { OpenCascadeInstance, TopoDS_Shape } from 'opencascade.js';
import {
  WorkerAction,
  IWorkerMessage,
  MainAction,
  IMainMessage,
  IDict
} from '../types';
import WorkerHandler from './actions';

import { OpenCascadeModel } from './model';
let occ: OpenCascadeInstance;
let ports: IDict<MessagePort> = {};
let lock = false;

export const MODELS = new Map<string, OpenCascadeModel>()

const registerWorker = async (id: string, port: MessagePort) => {
  if (!lock) {
    lock = true;
    occ = await initOpenCascade();
    (self as any).occ = occ;
    ports[id] = port;
    for (const id of Object.keys(ports)) {
      sendToMain({ action: MainAction.INITIALIZED, payload: false }, id);
    }
  } else {
    ports[id] = port;
    if (occ) {
      sendToMain({ action: MainAction.INITIALIZED, payload: false }, id);
    }
  }
};

const sendToMain = (msg: IMainMessage, id: string) => {
  if (id in ports) {
    ports[id].postMessage(msg);
  }
};

self.onmessage = async (event: MessageEvent): Promise<void> => {
  const message = event.data as IWorkerMessage;
  const { id } = message;
  switch (message.action) {
    case WorkerAction.REGISTER: {
      const port = event.ports[0];
      await registerWorker(id, port);
      break;
    }
    case WorkerAction.LOAD_FILE: {
      console.log('payload', message.payload);
      if(!MODELS.has(message.payload.fileName)){
        const model = new OpenCascadeModel()
        MODELS.set(message.payload.fileName, model)
      }
      const result = WorkerHandler[message.action](message.payload);
      sendToMain(
        {
          action: MainAction.DISPLAY_SHAPE,
          payload: { faceList: result.faceList, edgeList: result.edgeList }
        },
        id
      );
      break;
    }
    case WorkerAction.CLOSE_FILE: {
      MODELS.delete(message.payload.fileName);
      break;
    }
  }
};
