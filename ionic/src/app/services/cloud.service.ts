import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FsmService } from './fsm.service';

@Injectable({
  providedIn: 'root'
})
export class CloudService {

  constructor(
    private angularFireFunctions: AngularFireFunctions,
    public toastController: ToastController,
    public fsmService: FsmService,

  ) { }


  // getStatus() returns:
  // 0: garage open
  // 1: garage closed
  async getStatus(): Promise<number> {

    let status = -1;
    try {

      let response = await firstValueFrom(this.callParticleFunctionCloudFx("getStatus"));
      response = JSON.parse(response);
      // console.log(response);

      if (response?.connected) {
        status = response?.return_value === 0 ? 0 : 1;
        // console.log("Garage status: ", status);
      } else {
        let msg = "Failed to get status.";
        if (!response?.connected)
          msg = msg + " Device not connected.";
        await this.toast(msg);
      }

    } catch (error) {
      console.log("Error getting status: ", error);
      await this.toast("Failed to get status.");
    }
    finally {
      return status;
    }

  }


  async toggleRelay() {
    try {
      this.fsmService.send('toggle');

      let response = await firstValueFrom(this.callParticleFunctionCloudFx("toggleRelay"));
      response = JSON.parse(response);

      if (response?.connected && response?.return_value === 0) {
        // await this.toast("Command sent.");
      } else {
        let msg = "Failed to send command.";
        if (!response?.connected)
          msg = msg + " Device not connected.";
        await this.toast(msg);
      }
    }
    catch (error) {
      console.log("Error toggling relay: ", error);
      await this.toast("Failed to send command.");
    }
  }


  callParticleFunctionCloudFx(functionName: string, arg: string = "") {
    const callable = this.angularFireFunctions.httpsCallable('callParticleFunction');
    return callable({ functionName: functionName, arg: arg })
  }

  // ---------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------
  public async toast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

}
