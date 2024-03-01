import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  // -1: unknown
  //  0: garage open
  //  1: garage closed
  public garageStatus = -1;

  public email: string = "";
  public password: string = "";

  public signingIn = false;
  public refreshing = false;
  public sendingCommand = false;

  public user: any;
  public doneLoading = false;

  constructor(
    private angularFireFunctions: AngularFireFunctions,
    public toastController: ToastController,
    public fireAuth: AngularFireAuth,
  ) { }


  async ngOnInit() {
    this.fireAuth.authState.subscribe(async (user) => {
      if (user) {
        await this.getStatus();
        this.signingIn = false;
      }
      user ? this.user = user : this.user = null;

      this.doneLoading = true;
    });
  }


  // ---------------------------------------------------------------
  // sign in
  // ---------------------------------------------------------------
  getSigningInButtonText() {
    if (this.signingIn) {
      return "";
    }
    else {
      return "Sign In";
    }
  }


  signIn() {
    this.signingIn = true;
    this.fireAuth.signInWithEmailAndPassword(this.email, this.password).then(() => {
      console.log("User signed in");
    }
    ).catch((error) => {
      console.log("Error signing in: ", error);
      this.toast("Failed to sign in: " + error.message);
      this.signingIn = false;
    }).finally(() => {
    });
  }


  // ---------------------------------------------------------------
  // garage
  // ---------------------------------------------------------------
  getGarageButtonText() {
    if (this.sendingCommand) {
      return "";
    }
    if (this.garageStatus == 0)
      return "Close Garage";
    else if (this.garageStatus == 1)
      return "Open Garage";
    else
      return "Toggle Garage";
  }


  toggleGarage() {
    this.toggleRelay();
  }


  async handleRefresh(event: any) {
    this.refreshing = true;
    await this.getStatus();
    event.target.complete();
    this.refreshing = false;
  }

  // ---------------------------------------------------------------
  // cloud functions
  // ---------------------------------------------------------------

  // getStatus() returns:
  // 0: garage open
  // 1: garage closed
  async getStatus() {
    try {
      let response = await this.callParticleFunctionCloudFx("getStatus").toPromise();
      response = JSON.parse(response);
      console.log(response);

      if (response?.connected) {
        this.garageStatus = response?.return_value === 0 ? 0 : 1;
        console.log("Garage status: ", this.garageStatus);
      } else {
        this.garageStatus = -1;
        let msg = "Failed to get status.";
        if (!response?.connected)
          msg = msg + " Device not connected.";
        await this.toast(msg);
      }

    } catch (error) {
      console.log("Error getting status: ", error);
      await this.toast("Failed to get status.");
    }
  }


  async toggleRelay() {
    try {
      this.sendingCommand = true;

      let response = await this.callParticleFunctionCloudFx("toggleRelay").toPromise();
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
    finally {
      this.sendingCommand = false;
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
