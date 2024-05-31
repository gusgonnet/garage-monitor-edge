import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor(
    public toastController: ToastController,
  ) { }


  // show a toast message for 3 seconds
  public async toast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

  // delay for a specified number of milliseconds
  public delay(delayInMs: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, delayInMs);
    });
  }

}
