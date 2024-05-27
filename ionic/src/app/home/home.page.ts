import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FsmService } from '../services/fsm.service';
import { CloudService } from '../services/cloud.service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  public email: string = "";
  public password: string = "";

  public signingIn = false;
  public loggedIn = false;
  public doneLoading = false;

  public fsmInfo$: any;

  constructor(
    public toastController: ToastController,
    public fireAuth: AngularFireAuth,
    public fsmService: FsmService,
    public cloudService: CloudService,
  ) { }


  async ngOnInit() {
    this.fireAuth.authState.subscribe(async (user) => {
      if (user) {
        const status = await this.cloudService.getStatus();
        if (status >= 0) {
          this.fsmService.send(status === 0 ? "open" : "close");
        }
        this.signingIn = false;
        this.loggedIn = true;
      }

      this.doneLoading = true;
    });

    // subscribe to garage door state changes
    this.fsmService.actor.subscribe((state) => {
      this.fsmInfo$ = state;
      console.log(`FSM state: ${state}, value: ${state.value}, doorIsMoving: ${state.context.doorIsMoving}`);
    });

  }


  // ---------------------------------------------------------------
  // sign in
  // ---------------------------------------------------------------
  signIn() {
    this.signingIn = true;
    this.fireAuth.signInWithEmailAndPassword(this.email, this.password).then(() => {
      console.log("User signed in");
    }
    ).catch((error) => {
      console.log("Error signing in: ", error);
      this.cloudService.toast("Failed to sign in: " + error.message);
      this.signingIn = false;
    }).finally(() => {
    });
  }


  // ---------------------------------------------------------------
  // garage
  // ---------------------------------------------------------------
  async handleRefresh(event: any) {
    const status = await this.cloudService.getStatus();
    if (status >= 0) {
      this.fsmService.send(status === 0 ? "open" : "close");
    }
    event.target.complete();
  }

}
