/* global module */

var r = require('rethinkdb');
var connectdb = require("./ConnectDb");

var self = this;

/**
 * Insere ou atualiza a tabela que tem o sensor com os AP que detectou
 * @param {type} valuesAp
 * @param {type} client
 * @returns {undefined}
 */
module.exports.insertAntAp = function (client, mac, pwr, chnl, priv, cphr, ath, essid) {
  r.connect(self.dbData).then(function (conn) {
    var vendor = r.db("Prefix").table("tblPrefix").get(mac.substring(0, 8)).getField("vendor").default("UNKNOWN");
    return r.branch(
            vendor.ne(null),
            r.db(self.dbConfig.db)
            .table("AntAp")
            .get(client)
            .replace(function (row) {
              return r.branch(
                      row.eq(null),
                      {
                        "nomeAntena": client,
                        "host": [{
                            "macAddress": mac,
                            "channel": chnl,
                            "Privacy": priv,
                            "Cipher": cphr,
                            "Authentication": ath,
                            "ESSID": essid,
                            "data": r.now().inTimezone("+01:00").toEpochTime(),
                            "Power": pwr,
                            "nameVendor": vendor
                          }]
                      },
              r.branch(
                      row("host")("macAddress").contains(mac),
                      row.merge({
                        "host": row("host").map(function (d) {
                          return r.branch(
                                  d("macAddress").eq(mac).default(false),
                                  {
                                    "macAddress": mac,
                                    "channel": chnl,
                                    "Privacy": priv,
                                    "Cipher": cphr,
                                    "Authentication": ath,
                                    "ESSID": essid,
                                    "data": r.now().inTimezone("+01:00").toEpochTime(),
                                    "Power": pwr,
                                    "nameVendor": vendor
                                  }, d)
                        })
                      }),
                      {
                        "nomeAntena": client,
                        "host": row("host").append({
                          "macAddress": mac,
                          "channel": chnl,
                          "Privacy": priv,
                          "Cipher": cphr,
                          "Authentication": ath,
                          "ESSID": essid,
                          "data": r.now().inTimezone("+01:00").toEpochTime(),
                          "Power": pwr,
                          "nameVendor": vendor
                        })}));
            }, {nonAtomic: true, durability: "soft"}), "nao faz").run(conn)
            .finally(function () {
              conn.close();
            });
  }).then(function (output) {
//    console.log("Ant Ap -> ", client, mac, pwr, chnl, priv, cphr, ath, essid);
//    console.log("Query Ant Ap output:\n", output);
  }).error(function (err) {
    console.log("***************** Ant Ap **************************");
    console.log("Failed:", err);
  });
};