import { Component, OnInit } from '@angular/core';
import { LoadScriptService } from '../../services/load-script.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

declare var ace: any;
declare var window: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  html: any;
  htmlEditor: any;
  output: any;
  error: any = false;
  loading: any = false;
  workspace: any = false;

  search: any = '';
  searching: any = false;
  searchResp: any = false;

  constructor(
    private API: ApiService,
    private LS: LoadScriptService
  ) {
    this.workspace = localStorage.getItem('workspace') || false;
  }

  ngOnInit() {
    this.LS.loadScript("assets/ace/ace.js", "js", () => {
      setTimeout(() => {
        this.init();
      }, 100);
    });
  }

  uploaded(e) {
    if (!e || e == '') {
      return alert("Something went wrong, upload not received, or empty");
    }

    this.htmlEditor.setValue(e);
    this.output = '';
  }

  download(){
    // Set up the link
    var link = document.createElement("a");
    link.setAttribute("target","_blank");

    if(Blob !== undefined) {
      var blob = new Blob([this.htmlEditor.getValue()], {type: "text/plain"});
      link.setAttribute("href", URL.createObjectURL(blob));
    } else {
      link.setAttribute("href","data:text/plain," + encodeURIComponent(URL.createObjectURL(blob)));
    }

    let now = new Date();
    let date = [now.getDate(), now.getMonth(), now.getFullYear()];
    let time = [now.getHours(), now.getMinutes(), now.getSeconds()];
    link.setAttribute("download", "RubyConsole_" + date.join("-") + "_" + time.join(":") + ".rb");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  run() {
    if (this.loading || !this.htmlEditor.getValue()) {
      return false;
    }

    this.error = false;
    this.loading = true;
    this.output = '';

    this.API.apiCall(environment.host + environment.endpoints['document'], { body: this.htmlEditor.getValue() }).subscribe((data) => {
      //console.log("RESP", data);
      if (data.state !== "success" || !data.data) {
        this.clearLoading();
        this.output = data.message;
        this.error = true;
        return false;
      }

      if (data.data) {
        this.output = data.data;
        this.clearLoading();
      }
    });
  }

  ri() {
    if (!this.search || this.search == '' || this.searching) {
      return false;
    }

    this.searching = true;
    this.searchResp = false;

    this.API.apiCall(environment.host + environment.endpoints['help'], { body: this.search }).subscribe((data) => {
      if (data.state !== "success" || !data.data) {
        this.searchResp = false;
        this.searching = false;
        return false;
      }

      if (data.data) {
        this.searching = false;
        this.searchResp = data.data;
      }
    });
  }

  clearLoading() {
    setTimeout(() => {
      this.loading = false;
    }, 100);
  }

  saveWorkspace() {
    this.workspace = this.htmlEditor.getValue();
    localStorage.setItem('workspace', this.htmlEditor.getValue());
  }

  init() {
    this.htmlEditor = ace.edit("editor");
    this.htmlEditor.setTheme("ace/theme/github");
    this.htmlEditor.session.setMode("ace/mode/ruby");

    if (this.workspace && this.workspace !== '') {
      this.htmlEditor.setValue(this.workspace);
    } else {
      this.htmlEditor.setValue('puts "Hello, World"');
    }

    let $scope = this;
    this.htmlEditor.getSession().on('change', function(e) {
      $scope.saveWorkspace();
    });
  }
}
