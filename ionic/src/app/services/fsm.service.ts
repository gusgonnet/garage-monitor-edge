import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { createMachine, createActor, assign, fromPromise } from 'xstate';

// number of seconds the garage door takes to open or close
const GARAGE_OPEN_CLOSE_DELAY = 3;

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
        on: { close: 'Closed', open: 'Open', toggle: 'Moving' },
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
        // on: { close: 'Closed', open: 'Open' },
        // after: { [GARAGE_OPEN_CLOSE_DELAY * 1000]: 'Open' },
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = true,
          actionButton: ({ context }) => context.actionButton = '',
        }),
        invoke: {
          src: 'fetchDataService',
          onDone: {
            target: 'Open',
            actions: (context: any) => console.log(context.event.output)
          },
          onError: {
            target: 'Closed',
            actions: (context: any) => console.error(context)
          }
        }
      },
      Closing: {
        on: { close: 'Closed', open: 'Open' },
        after: { [GARAGE_OPEN_CLOSE_DELAY * 1000]: 'Closed' },
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = true,
          actionButton: ({ context }) => context.actionButton = '',
        }),
      },
      Moving: {
        on: { close: 'Closed', open: 'Open' },
        after: { [GARAGE_OPEN_CLOSE_DELAY * 1000]: 'Closed' },
        entry: assign({
          doorIsMoving: ({ context }) => context.doorIsMoving = true,
          actionButton: ({ context }) => context.actionButton = '',
        }),
      },
    },
  }).provide({
    actors: {
      fetchDataService: fromPromise((context) => this.fetchData(context))
    }
  });

  public actor;

  constructor() {
    this.actor = createActor(this.garageFSM);

    // Start the actor
    this.actor.start();

  }

  send(event: string) {
    this.actor.send({ type: event });
  }

  fetchData(context: any): Promise<string> {
    console.log('Current context:', context); // Log the current context

    return new Promise((resolve,reject) => {
      setTimeout(() => {
        // resolve('Data fetched successfully');
        reject('Data fetch failed');
      }, 2000);
    });
  };

}
