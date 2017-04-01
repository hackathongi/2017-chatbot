// Description:
//   TarlaAPI connector.
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot show devices
//   hubot exec <command> <action> <param>="<value>" <param2>="<value2>"
//   hubot I want to <text_in_catalan>
//   hubot *whatever* memes *whatever*
//
// Author:
//   d_asensio

const request   = require('request'),
      _         = require('lodash');

function parseCommand(str){
  let pos = -1;
  let param = [];
  let open = false;
  for (let i = 0; i<str.length; i++){
    if (str[i] === '"'){
      if (open === false){
        open = true; pos++;
        param[pos] = '';
        param[pos] += str[i];
      }
      else if (open === true && (str.indexOf('\"',i-1) === i)){
        open = false;
        param[pos] += str[i];
      }
      else if (open) param[pos] += str[i];
    }
    else if (open) param[pos] += str[i];
  }

  let res = '';
  for (let j = 0; j<param.length; j++){
    res = str.replace(param[j],'');
    str = res;
  }

  let final_array = str.split(' ');
  pos = 0;
  for (let k = 0; k<final_array.length;k++){
    if (~final_array[k].indexOf("\=")){
      final_array[k] += param[pos].replace(/\"/g, '');
      pos++;
    }
  }

  return final_array;
}

function validateCommand(action, command, params = []) {
  return new Promise((resolve, reject) => {
    request.get({uri:'http://tarla.hackathongi.cat/devices', json : true}, (err, r, body) => {
      if (body[action] && body[action].actions[command]) {
        _.each(params, function(param) {
          param = param.split('=')[0];
          if (body[action].actions[command].parameters) {
            if (body[action].actions[command].parameters[param] === undefined) {
              reject();
            }
          } else {
            reject();
          }
        });

        resolve();
      } else {
        reject();
      }
    });
  });
}

function getFormattedURI(action, command, params = []) {
  const nParams = params.length - 1;

  let initialURI = 'http://192.168.4.250/devices/' + action + '/cmds/' + command + (nParams === -1?'':'?');

  _.each(params, (param, n) => {
    initialURI += param + (nParams !== n?'&':'');
  });

  return initialURI;
}

module.exports = function(robot){
  robot.respond(/show\sdevices$/i, (msg) => {
    request.get({uri:'http://tarla.hackathongi.cat/devices', json : true}, (err, r, body) => {
      let devicesText = 'You can run any command by typing "alfred exec <action> <command> <param1...>"\n';

      _.each(body, (command_opts, command) => {
        devicesText += command + (' (' + command_opts.description + '):\n');
        _.each(command_opts.actions, (action_opts, action) => {
          devicesText += '\t\t' + action + (' (' + action_opts.description + '):\n');
          _.each(action_opts.parameters, (description, parameter) => {
            devicesText += '\t\t\t\t' + parameter + (' (' + description + '):\n')
          });
        });
      });

      msg.send(devicesText);
    });
  });


  robot.respond(/exec\s(.*)$/i, (msg) => {
    let raw_command = parseCommand(msg.match[1]),
        action = raw_command[0],
        command = raw_command[1],
        params = [];

    if (raw_command[2]) {
      for(let i = 2 ; i < raw_command.length ; i++) {
        params.push(raw_command[i]);
      }
    }

    validateCommand(action, command, params).then(() => {
      const formattedURI = getFormattedURI(action, command, params);
      msg.send('Request sent to: ' + formattedURI);

      request.get({uri: formattedURI, json : false}, (err, r, body) => {
        msg.send('Response received: ' + body);
      });
    }).catch(() => {
      msg.send('WRONG COMMAND');
    });
  });


  robot.respond(/I\swant\sto\s(.*)$/i, (msg) => {
    request.get({uri:'http://192.168.4.110/api/parse/' + msg.match[1], json : false}, (err, r, tarlaURI) => {

      msg.send(tarlaURI);
      request.get({uri:tarlaURI, json : false}, (err, r, body) => {
        msg.send(body);
      });
    });
  });

  robot.respond(/.*\s?memes?\s?.*$/i, (msg) => {
    let randomint = 140001 + Math.floor(Math.random() * 10000);
    let reponses = ["Yessir", "Oui", "Memevamemeviene", "Dank Meme hot for u", "Spiced memes served"];
    msg.send(reponses[randomint%reponses.length]);
    msg.send("http://images.memes.com/meme/" + randomint.toString() + "?.gif?.jpg");
  });
}
