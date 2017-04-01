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
//
// Author:
//   d_asensio

const request   = require('request'),
      _         = require('lodash');

module.exports = function(robot){
  robot.respond(/show\sdevices$/i, (msg) => {
    request.get({uri:'http://tarla.hackathongi.cat/devices', json : true}, (err, r, body) => {
      let msg_help_txt = '';

      _.each(body, (command_desc, command_name) => {
        msg_help_txt += (command_name + ' (' + command_desc.description  + ')\n');
      });

      msg.send(msg_help_txt);
      console.log(body);
    })
  });
}
