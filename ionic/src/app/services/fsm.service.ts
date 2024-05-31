import { Injectable } from '@angular/core';
import { createMachine, createActor, assign, fromPromise } from 'xstate';
import { HelperService } from './helper.service';
import { CloudService } from './cloud.service';

// number of seconds the garage door takes to open or close
const GARAGE_OPEN_CLOSE_DELAY = 12;

@Injectable({
  providedIn: 'root'
})
export class FsmService {

  private garageFSM = createMachine({
    id: 'fsm',
    context: {
      doorIsMoving: false,
      actionButton: 'Move Door',
    },
    initial: 'Unknown',
    states: {
      Unknown: {
        on: { close: 'Closed', open: 'Open' },
      },
      Closed: {
        on: { open: 'Opening', toggle: 'Opening' },
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = false,
          actionButton: ({ context }) => context.actionButton = 'Open Door',
        }),
      },
      Open: {
        on: { close: 'Closing', toggle: 'Closing' },
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = false,
          actionButton: ({ context }) => context.actionButton = 'Close Door',
        }),
      },
      Opening: {
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = true,
          actionButton: ({ context }) => context.actionButton = '',
        }),
        invoke: {
          src: 'waitForOpenWrapper',
          onDone: {
            target: 'Open',
          },
          onError: {
            target: 'Closed',
          }
        }
      },
      Closing: {
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = true,
          actionButton: ({ context }) => context.actionButton = '',
        }),
        invoke: {
          src: 'waitForClosedWrapper',
          onDone: {
            target: 'Closed',
          },
          onError: {
            target: 'Open',
          }
        }
      },
    },
  }).provide({
    actors: {
      waitForOpenWrapper: fromPromise(() => this.waitForOpen()),
      waitForClosedWrapper: fromPromise(() => this.waitForClosed())
    }
  });

  public actor;

  constructor(
    public helperService: HelperService,
    public cloudService: CloudService,
  ) {
    this.actor = createActor(this.garageFSM);

    // Start the actor
    this.actor.start();
  }


  send(event: string) {
    this.actor.send({ type: event });
  }


  // wait until the door is open, then verify is actually open
  async waitForOpen(): Promise<void> {

    // wait until the door is closed + a little extra time
    await this.helperService.delay(GARAGE_OPEN_CLOSE_DELAY * 1000 + 2000);

    // verify the door is actually open
    const status = await this.cloudService.getStatus();
    if (status === 0) {
      console.log("Garage is open now");
      return Promise.resolve();
    }

    this.helperService.toast("Garage failed to open");
    return Promise.reject()
  };


  // wait until the door is closed, then verify is actually closed
  async waitForClosed(): Promise<void> {

    // wait until the door is closed + a little extra time
    await this.helperService.delay(GARAGE_OPEN_CLOSE_DELAY * 1000 + 2000);

    // verify the door is actually open
    const status = await this.cloudService.getStatus();
    if (status === 1) {
      console.log("Garage is closed now");
      return Promise.resolve();
    }

    this.helperService.toast("Garage failed to close");
    return Promise.reject()
  };


}
