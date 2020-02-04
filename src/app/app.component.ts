import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { SplashScreen } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {   
      /* To make sure we provide the fastest app loading experience 
         for our users, you must hide the splash screen automatically 
         when your app is ready to be used
         
         https://capacitor.ionicframework.com/docs/apis/splash-screen#hiding-the-splash-screen
      */
      SplashScreen.hide();
    });
  }
}
