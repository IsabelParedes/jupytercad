import { User } from '@jupyterlab/services';
import { ISignal, Signal } from '@lumino/signaling';

import { IDict, IJupyterCadDoc } from '../types';

export interface IAnnotationContent {
  user?: User.IIdentity;
  value: string;
}

export interface IAnnotation {
  label: string;
  position: [number, number, number];
  contents: IAnnotationContent[];
}
export class AnnotationModel {
  constructor(options: AnnotationModel.IOptions) {
    this._getCoordinate = options.getCoordinate;
    this._sharedModel = options.sharedModel;
    const state = this._sharedModel.awareness.getLocalState();
    this._user = state?.user;
  }

  get updateSignal(): ISignal<this, null> {
    return this._updateSignal;
  }

  update(): void {
    this._updateSignal.emit(null);
  }
  getAnnotation(id: string): IAnnotation | undefined {
    const rawData = this._sharedModel.metadata.get(id);
    if (rawData) {
      return JSON.parse(rawData) as IAnnotation;
    }
  }

  addAnnotation(key: string, value: IDict): void {
    this._sharedModel.setMetadata(key, JSON.stringify(value));
  }

  removeAnnotation(key): void {
    this._sharedModel.removeMetadata(key);
  }

  getCoordinate(id: string): [number, number] | undefined {
    const annotation = this.getAnnotation(id);
    if (annotation?.position) {
      return this._getCoordinate(annotation.position);
    }
  }

  addContent(id: string, value: string): void {
    const newContent: IAnnotationContent = {
      value,
      user: this._user
    };
    const currentAnnotation = this.getAnnotation(id);
    if (currentAnnotation) {
      const newAnnotation: IAnnotation = {
        ...currentAnnotation,
        contents: [...currentAnnotation.contents, newContent]
      };

      this._sharedModel.setMetadata(id, JSON.stringify(newAnnotation));
    }
  }

  private _sharedModel: IJupyterCadDoc;
  private _getCoordinate: (input: [number, number, number]) => [number, number];
  private _updateSignal = new Signal<this, null>(this);
  private _user?: User.IIdentity;
}

namespace AnnotationModel {
  export interface IOptions {
    sharedModel: IJupyterCadDoc;
    getCoordinate: (input: [number, number, number]) => [number, number];
  }
}