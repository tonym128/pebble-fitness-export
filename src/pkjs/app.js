/*
 * Copyright (c) 2017, Anthony Mamacos
 * Copyright (c) 2016-2017, Natacha Porté
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var Clay = require('pebble-clay');
var clayConfig = require('./config.js');
new Clay(clayConfig);

var cfg_endpoint = null;
var cfg_bundle_max = 1;
var cfg_auth_token = "";
var cfg_auto_close = false;
var cfg_wakeup_time = -1;

var to_send = [];
var sender = new XMLHttpRequest();
var bundle_size = 0;
var startDate = new Date();

var endDate   = new Date();
var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
var sending = false;

function sendPayload(payload) {
   var payload_array = [];
   var counter = 0;
  
   while (counter < payload.length) {
     var data = {};
     var components = payload[counter].split(',');
     data.timestamp = components[0];
     data.steps = components[1];
     data.yaw = components[2];
     data.pitch = components[3];
     data.vmc = components[4];
     data.light = components[5];
     data.activity = components[6];
     data.hrbpm = components[7];
     payload_array.push(data);
     counter++;
    }

   sender.open("POST", cfg_endpoint, true);
   sender.setRequestHeader("Authorization", "Token token="+cfg_auth_token);
   sender.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
   sender.send(JSON.stringify(payload_array));
}

function sendHead() {
   if (to_send.length < 1) return;
   sending = true;
   bundle_size = 0;

  endDate = new Date();  
  seconds = (endDate.getTime() - startDate.getTime()) / 1000;
  if (to_send.length < cfg_bundle_max && seconds < 5) {
    sending = false;
    return;
  }
  
  startDate = endDate;

  var payload = [];
  while (bundle_size < cfg_bundle_max && bundle_size < to_send.length) {
     payload.push(to_send[bundle_size].split(";")[1]);
     bundle_size += 1;
  }

  console.log("BundleSize : " + parseInt(bundle_size) + " Seconds : " + parseInt(seconds));
  sendPayload(payload);
}

function enqueue(key, line) {
  to_send.push(key + ";" + line);
  localStorage.setItem("toSend", to_send.join("|"));
  localStorage.setItem("lastSent", key);

  // Update Last Sent Key to value being queued
  var claysettings = JSON.parse(localStorage.getItem('clay-settings'));
  claysettings.lastSent = key;
  localStorage.setItem("clay-settings",JSON.stringify(claysettings));
   
  if (to_send.length > 1 && !sending) {
      Pebble.sendAppMessage({ "uploadStart": parseInt(key, 10) });
      sendHead();
  }
}

function uploadDone() {
   sending = false;
   if (bundle_size > 1) {
      to_send.splice(0, bundle_size - 1);
   }

   var sent_key = to_send.shift().split(";")[0];
   localStorage.setItem("toSend", to_send.join("|"));

   Pebble.sendAppMessage({ "uploadDone": parseInt(sent_key, 10) });

   sendHead();
}

function uploadError() {
   sending = false;
   console.log(this.statusText);
   Pebble.sendAppMessage({ "uploadFailed": this.statusText });
}

sender.addEventListener("load", uploadDone);
sender.addEventListener("error", uploadError);

function loadSettings() {  
  var msg = {};
  var claysettings;  
  try {
   claysettings = JSON.parse(localStorage.getItem('clay-settings'));
   cfg_endpoint = claysettings.cfgEndpoint;
   cfg_auth_token = claysettings.cfgAuthToken;
   cfg_bundle_max = parseInt(claysettings.cfgBundleMax || "1", 10);
   cfg_auto_close = (parseInt(claysettings.cfgAutoClose || "0", 10) > 0);
   cfg_wakeup_time = -1; //parseInt(claysettings.cfgWakeupTime || "-1", 10);
  } catch (e) {
     msg.modalMessage = "Not configured";
     Pebble.sendAppMessage(msg);
   return;
  }

  var str_to_send = localStorage.getItem("toSend");
  to_send = str_to_send ? str_to_send.split("|") : [];

   if (cfg_bundle_max < 1) cfg_bundle_max = 1;
   
   // Obey Resend Variable
   if (claysettings.resend) {
     console.log("Initiating Resend");
     claysettings.resend = false;

     sender.abort();
     localStorage.setItem("toSend", "");
     localStorage.setItem("lastSent", "0");
     to_send = [];
     
     localStorage.setItem("clay-settings",JSON.stringify(claysettings));
     console.log("Resend setup complete");
     return;
   }

   if (cfg_endpoint) {
      msg.lastSent = parseInt(localStorage.getItem("lastSent") || "0", 10);
      Pebble.sendAppMessage(msg);
      return;
   } else {
      msg.modalMessage = "Not configured";
      console.log("Not configured");
      Pebble.sendAppMessage(msg);
      return;
   }

   if (to_send.length >= 1) {
      msg.uploadStart = parseInt(to_send[0].split(";")[0]);
      console.log("Upload Start : " + msg.uploadStart);
      Pebble.sendAppMessage(msg);
      sendHead();
      return;
   }
}

Pebble.addEventListener("ready", function() {
   console.log("Health Export PebbleKit JS ready!");
   loadSettings();  
});

Pebble.addEventListener("appmessage", function(e) {
   if (e.payload.dataKey && e.payload.dataLine) {
     enqueue(e.payload.dataKey, e.payload.dataLine);
   }
});