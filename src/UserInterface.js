import React, { Component } from 'react';
import TabTable from './TabTable'
import Select from 'react-select'
import 'react-select/dist/react-select.css';
import './UserInterface.css'

const URL_GET_FILENAMES = 'GetFileNamesRe.php'
const URL_GET_USERNAMES = 'GetUserNames.php'
const URL_COMMON_ANNOTATED_FILENAMES = 'GetCommonFileNamesRe.php'
const URL_GET_ANNOTATION_FILE = 'GetAnnotationFileRe.php'
const URL_POST_JSON = 'PostAnnotatedJSONRe.php'
const PDF_DIR = '../ConsortAnnotation/pdfs/'

export default class UserInterface extends Component {

  constructor(props) {
    super(props);
    this.retrieveUserNames();
    this.retrieveFileNames();
    this.handleUserChange = this.handleUserChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.updateFileList = this.updateFileList.bind(this);
    this.handleReconciliationSubmit = this.handleReconciliationSubmit.bind(this);
    this.handleReconciliationChange = this.handleReconciliationChange.bind(this);
    this.state = {
    };
  }

  retrieveUserNames() {
    var httprequest = new XMLHttpRequest();
    httprequest.open('POST', URL_GET_USERNAMES, true);
    httprequest.setRequestHeader("Content-type", "application/json");
    httprequest.onreadystatechange = () => {
      if(httprequest.readyState === 4){
        var response = httprequest.responseText;
        var userNames = response.trim().split(" ");
        var users = [];
        for (var user of userNames) {
          users.push({value: user, label: user});
        }
        this.setState({users: users});
      }
    };
    httprequest.send(null);
  }

  retrieveFileNames() {
    var httprequest = new XMLHttpRequest();
    httprequest.open('POST', URL_GET_FILENAMES, true);
    httprequest.setRequestHeader("Content-type", "application/json");
    httprequest.onreadystatechange = () => {
      if(httprequest.readyState === 4){
        var response = httprequest.responseText;
        var fileNames = response.trim().split(" ");
        var files = [];
        if(fileNames.length != 0) {
          for (var file of fileNames) {
            files.push({value: file, label: file});
          }
          this.setState({files: files});
        }
      }
    };
    httprequest.send(null);
  }

  handleFileChange(e) {
    if(e) {
      this.setState({selectedFile: e, showTable: false});
      if(this.state.selectedUsers.length > 1) {
        this.fetchData(e);
      }
    }else{
      this.setState({selectedFile: null, showTable: false});
    }
  }

  handleUserChange(e){
    this.setState({selectedFile: null, showTable: false});
    if(e) {
      this.setState({selectedUsers: e});
      if(e.length > 1) {
        this.updateFileList(e);
        document.getElementById('message').innerHTML = '';
      }else{
        this.setState({showTable: false})
        document.getElementById('message').innerHTML = 'Select at least two users';
      }
    }else{
      this.setState({selectedUsers: null, showTable: false});
      document.getElementById('message').innerHTML = 'Select at least two users';
    }

  }

  handleReconciliationChange(i, rowIndex, e) {
    var selectionValuesDict = this.state.selectionValuesDict;
    var valueArray = selectionValuesDict['Reconciliation'];
    if (e) {
      var columnArray = valueArray[i] || [];
      var selection = '';
      for (var k = 0; k < e.length; k++) {
        selection = selection + e[k].index + ' ';
      }
      columnArray[rowIndex] = selection.trim();
      valueArray[i] = columnArray;
      selectionValuesDict['Reconciliation'] = valueArray;
      this.setState({selectionValuesDict: selectionValuesDict});
    }else{
      valueArray[i][rowIndex] = null;
      selectionValuesDict['Reconciliation'] = valueArray;
      this.setState({selectionValuesDict: selectionValuesDict});
    }
  }

  handleReconciliationSubmit(e){
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder();
    var json = this.state.xmlParsedJson;
    var selection;
    var selectionValues = this.state.selectionValuesDict['Reconciliation'];
    for (var i = 0; i < this.state.data.length; i++){
      for (var j = 0; j < this.state.data[i].length; j++) {
        var index = this.findSentenceIndex(this.state.data[i][j].sentence_id);
        if (index != -1) {
          if (selectionValues[i]) {
            if (selectionValues[i][j]) {
              selection = selectionValues[i][j];
              json.document.sentence[index].$.selection = selection;
            }else {
              json.document.sentence[index].$.selection = '';
            }
          }else{
            json.document.sentence[index].$.selection = '';
          }
        }
      }
    }
    var xml = builder.buildObject(json);
    var postJsonRequest= new XMLHttpRequest();
    postJsonRequest.open("POST", URL_POST_JSON, true);
    postJsonRequest.setRequestHeader("Content-type", "text/xml");
    postJsonRequest.onreadystatechange = () => {
      if(postJsonRequest.readyState === 4){
        var response = postJsonRequest.responseText;
        alert(`Successfully saved.`);
      }
    };
    var postJson = {};
    postJson["xml"] = xml;
    postJson["filename"] = this.state.selectedFile.value;
    postJsonRequest.send(JSON.stringify(postJson));
  }

  updateFileList(e){
    var httprequest = new XMLHttpRequest();
    httprequest.open('POST', URL_COMMON_ANNOTATED_FILENAMES, true);
    httprequest.setRequestHeader("Content-type", "application/json");
    httprequest.onreadystatechange = () => {
      if(httprequest.readyState === 4){
        var response = httprequest.responseText;
        if (response.trim() != '') {
          var fileNames = response.trim().split(" ");
          var files = [];
          for (var file of fileNames) {
            files.push({value: file, label: file});
          }
          this.setState({files: files});
        }else{
          this.setState({files: null});
          document.getElementById('message').innerHTML = 'No common annotation file exists';
        }
      }
    };
    var postJson = {};
    var userList = [];
    for (var user of e) {
      userList.push(user.value);
    }
    postJson["userList"] = userList.join(' ');
    httprequest.send(JSON.stringify(postJson));
    this.setState({userList: userList.join(' ')});
  }

  getSubTitles(section) {
    var subtitles = [];
    for ( var sec of section) {
      subtitles.push(sec.$.title);
      if (sec.section) {
        Array.prototype.push.apply(subtitles, this.getSubTitles(sec.section));
      }
    }
    return subtitles;
  }

  findSentenceIndex(sentence_id){
    var json = this.state.xmlParsedJson;
    var i = 0;
    while ( i < json.document.sentence.length) {
      if (json.document.sentence[i].$.id == sentence_id) {
        return i;
      }
      i++;
    }
    return -1;
  }

  fetchData(e) {
    var filename = e.value;
    var users = this.state.selectedUsers;
    var numOfUser = this.state.selectedUsers.length;
    var xmlrequest = new XMLHttpRequest();
    xmlrequest.open('POST', URL_GET_ANNOTATION_FILE, true);
    xmlrequest.setRequestHeader("Content-type", "application/json");
    xmlrequest.onreadystatechange = () => {
      if(xmlrequest.readyState === 4){
        var text = xmlrequest.responseText;
        var obj = JSON.parse(text);
        var xml2js = require('xml2js');
        var parser = new xml2js.Parser({trim: true});
        parser.parseString(obj[users[0].value], (err, result) => {
          var titleArray = [];
          var titleSpanArray = [];
          var textSpanArray = [];
          var dataArray = [[]];
          var subtitleIndexArray = [[]];
          var subtitleArray = [];
          var selectionValues = [[]];
          var reconcileValues = [[]];
          var curSentenceIndex = 1;
          var curSectionIndex = 0;
          selectionValues[curSectionIndex] = [];
          reconcileValues[curSectionIndex] = [];
          var docTitle = result.document.sentence[1].text[0]._;
          for (var section of result.document.section){
            if(titleArray.length > 0) {
              var lastSectionEndSpan = textSpanArray[textSpanArray.length - 1];
              var thisSectionStartSpan = section.$.textSpan.split('-')[0];
              if(parseInt(thisSectionStartSpan) - parseInt(lastSectionEndSpan) > 10) {
                titleArray.push("UNNAMED");
                titleSpanArray.push((parseInt(lastSectionEndSpan) + 1).toString());
                textSpanArray.push((parseInt(thisSectionStartSpan) - 1).toString());
              }
            }
            titleArray.push(section.$.title);
            titleSpanArray.push(section.$.titleSpan.split('-')[0]);
            textSpanArray.push(section.$.textSpan.split('-')[1]);
            if (section.section) {
              Array.prototype.push.apply(subtitleArray, this.getSubTitles(section.section));
            }
          }
          for (var sentence of result.document.sentence){
            let spans = sentence.$.charOffset.split('-');
            let start = spans[0];
            let span = spans[1];
            if (!titleSpanArray.includes(start)) {
              if(parseInt(span) <= parseInt(textSpanArray[curSectionIndex])){
                dataArray[curSectionIndex].push({id: curSentenceIndex, sentence: sentence.text[0]._, sentence_id: sentence.$.id});
                if (subtitleArray.includes(sentence.text[0]._)) {
                  subtitleIndexArray[curSectionIndex].push(curSentenceIndex);
                }
              }else{
                curSectionIndex = curSectionIndex + 1;
                curSentenceIndex = 1;
                selectionValues[curSectionIndex] = [];
                reconcileValues[curSectionIndex] = [];
                dataArray[curSectionIndex] = [];
                dataArray[curSectionIndex].push({id: curSentenceIndex, sentence: sentence.text[0]._, sentence_id: sentence.$.id});
                subtitleIndexArray[curSectionIndex] = [];
                if (subtitleArray.includes(sentence.text[0]._)) {
                  subtitleIndexArray[curSectionIndex].push(curSentenceIndex);
                }
              }

              if (!selectionValues[curSectionIndex]) {
                selectionValues[curSectionIndex] = [];
                reconcileValues[curSectionIndex] = [];
              }
              if(sentence.$.selection) {
                selectionValues[curSectionIndex][curSentenceIndex-1] = sentence.$.selection;
                reconcileValues[curSectionIndex][curSentenceIndex-1] = sentence.$.selection;
              }
              curSentenceIndex = curSentenceIndex + 1;
            }
          }
          var selectionValuesDict = {};
          selectionValuesDict[users[0].value] = selectionValues;
          selectionValuesDict['Reconciliation'] = reconcileValues;
          this.setState({titles: titleArray, data: dataArray, docTitle: docTitle, xmlParsedJson: result,
            selectionValuesDict: selectionValuesDict, subtitleIndexArray: subtitleIndexArray});
        });
        if(obj['Reconciliation']) {
          users.push({value: 'Reconciliation', label: 'Reconciliation'});
          numOfUser++;
        }
        for(var i = 1; i < numOfUser; i++) {
          parser.parseString(obj[users[i].value], (err, result) => {
            var titleArray = [];
            var titleSpanArray = [];
            var textSpanArray = [];
            var selectionValues = [[]];
            var curSentenceIndex = 1;
            var curSectionIndex = 0;
            selectionValues[curSectionIndex] = [];
            for (var section of result.document.section){
              if(titleArray.length > 0) {
                var lastSectionEndSpan = textSpanArray[textSpanArray.length - 1];
                var thisSectionStartSpan = section.$.textSpan.split('-')[0];
                if(parseInt(thisSectionStartSpan) - parseInt(lastSectionEndSpan) > 10) {
                  titleArray.push("");
                  titleSpanArray.push((parseInt(lastSectionEndSpan) + 1).toString());
                  textSpanArray.push((parseInt(thisSectionStartSpan) - 1).toString());
                }
              }
              titleArray.push(section.$.title);
              titleSpanArray.push(section.$.titleSpan.split('-')[0]);
              textSpanArray.push(section.$.textSpan.split('-')[1]);
            }
            for (var sentence of result.document.sentence){
              let spans = sentence.$.charOffset.split('-');
              let start = spans[0];
              let span = spans[1];
              if (!titleSpanArray.includes(start)) {
                if(parseInt(span) > parseInt(textSpanArray[curSectionIndex])){
                  curSectionIndex = curSectionIndex + 1;
                  curSentenceIndex = 1;
                  selectionValues[curSectionIndex] = [];
                }

                if (!selectionValues[curSectionIndex]) {
                  selectionValues[curSectionIndex] = [];
                }
                if(sentence.$.selection) {
                  selectionValues[curSectionIndex][curSentenceIndex-1] = sentence.$.selection;
                }
                curSentenceIndex = curSentenceIndex + 1;
              }
            }
            var selectionValuesDict = this.state.selectionValuesDict;
            selectionValuesDict[users[i].value] = selectionValues;
            this.setState({selectionValuesDict: selectionValuesDict});
          });
        }
        if(obj['Reconciliation']) {
          users.pop();
        }
        var masi = obj['masi'];
        document.getElementById('message').innerHTML = 'MASI value: ' + Number.parseFloat(masi).toPrecision(4);
        this.setState({showTable: true});
        document.getElementById('title').setAttribute("href", PDF_DIR + filename + ".pdf");
      }
    };
    var postJson = {};
    postJson["userList"] = this.state.userList;
    postJson["filename"] = filename;
    xmlrequest.send(JSON.stringify(postJson));
  }

  renderTable() {
    return (
      <div>
        <div class="row">
          <div id="titlediv">
            <a target="_blank" id="title">{this.state.docTitle}</a>
          </div>
          <div id="tabtablewrapper">
            <TabTable titles={this.state.titles} data={this.state.data} onSelectChange={this.handleReconciliationChange}
                selectionValuesDict={this.state.selectionValuesDict} selectedUsers={this.state.selectedUsers}
                subtitleIndexArray={this.state.subtitleIndexArray}/>
          </div>
        </div>

        <div id="buttonwrapper">
          <button onClick={this.handleReconciliationSubmit}> Submit </button>
        </div>
      </div>
    );
  }

  render(){
    return (
      <div>
        <div>
          <h1 align="center" id="header"> CONSORT Reconciliation Tool</h1>
          <a href="CONSORT-guideline.pdf" target="_blank" align="right">See Guideline</a>
          <div class="filters">
            <div class="userdropdown">
              <Select options={this.state.users} closeOnSelect={true} multi removeSelected={true} searchable ={false}
               onChange={this.handleUserChange} value={this.state.selectedUsers}/>
            </div>
            <div class="filedropdown">
              <Select options={this.state.files} closeOnSelect={true} searchable ={true}
               value={this.state.selectedFile} onChange={this.handleFileChange}/>
            </div>
            <div>
              <h6 id='message'></h6>
            </div>
          </div>
        </div>
        {this.state.showTable ? this.renderTable() : <h1> no table available </h1>}
      </div>
    );
  }
}
