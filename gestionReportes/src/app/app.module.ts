import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


import { UserhomeComponent } from './pages/userhome/userhome/userhome.component';
import { AdminhomeComponent } from './pages/adminhome/adminhome/adminhome.component';

import { LoginComponent } from './pages/login/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
   
    UserhomeComponent,
    AdminhomeComponent,
    
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
