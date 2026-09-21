
const DEFAULT_TIMEOUT_TIME = 4000;
const ROVER_PORT = '8080';

/**
 * The rover has historically been deployed at one of these addresses.  Keep
 * the list deliberately small: a discovery action should not indiscriminately
 * probe every device on a user's network.
 */
const ROVER_CANDIDATES = [
  `192.168.1.2:${ROVER_PORT}`,
  `192.168.0.2:${ROVER_PORT}`,
  `10.0.0.2:${ROVER_PORT}`,
  `ezrassor.local:${ROVER_PORT}`,
  `rerassor.local:${ROVER_PORT}`,
];

/**
 * Check if we can reach a specified IP + port.
 * 
 * @param {string} ip IP + port.
 * @param {number} timeoutTime Time before giving up and returning false.
 * @return {Promise<boolean>} True/false if we can reach/not reach the given address.
 */
export async function isIpReachable(ip, timeoutTime = DEFAULT_TIMEOUT_TIME) {

  console.log('Trying IP in connection.js: ', ip);

  return new Promise((resolve, _) => {

    const attemptConnection = fetch(`http://${ip}`); // default get request

    const timeout = new Promise((_, reject) => {
      setTimeout(reject, timeoutTime);
    });

    Promise
      .race([attemptConnection, timeout])
      .then(() => { resolve(true); })
      .catch(() => { resolve(false); })
  });
}

/**
 * Find a rover on the current local network using its supported local host
 * names and the standard RE-RASSOR deployment addresses.
 *
 * A React Native/Expo application cannot read a router's DHCP table without a
 * native network entitlement.  This keeps discovery useful on the supported
 * rover configurations while avoiding a broad, slow port scan of a user's
 * network.  The saved address is tried first so reconnecting after a screen
 * change is immediate.
 *
 * @param {string|null} savedIp Last successfully used rover address.
 * @return {Promise<string|null>} Reachable rover address, if one is found.
 */
export async function findRover(savedIp = null) {
  const candidates = [...new Set([savedIp, ...ROVER_CANDIDATES].filter(Boolean))];

  for (const candidate of candidates) {
    if (await isIpReachable(candidate, 1200)) {
      return candidate;
    }
  }

  return null;
}
