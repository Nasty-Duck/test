import React from 'react';
import {
  Text,
  View,
  Image,
  StatusBar,
  TextInput,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ControllerStyle from 'ezrassor-app/src/styles/controller';
import * as Font from 'expo-font';
import logo from 'ezrassor-app/assets/fsiLogo.png';
import arrowright from 'ezrassor-app/assets/arrowri.png';
import LottieView from 'lottie-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { findRover, isIpReachable } from '../../functionality/connection';
import { normalize } from '../../functionality/display';

const DEFAULT_IP = '192.168.1.2:8080';

/**
 * React component for the connect-to-ip screen.
 */
export default class IPConnect extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      ip: null,
      isFindingRover: false,
      discoveryMessage: ''
    };

    this.animation = React.createRef(null);
  }

  async componentDidMount() {
    await Font.loadAsync({ NASA: require('../../../assets/nasa.ttf') });

    this.animation = React.createRef(null);
    this.animation.current?.reset();

    this.setState({ isLoading: false });
    this.getIpFromStorage();

    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getIpFromStorage();
      this.animation.current?.reset();
    });

    this._blur = this.props.navigation.addListener('blur', () => {
      this.animation.current?.reset();
    });
  }

  async componentWillUnmount() {
    this.animation = React.createRef(null);
    this.animation.current?.reset();

    this._unsubscribe();
    this._blur();
  }

  /**
   * Set `this.state.ip` to the specified IP + port.
   * 
   * @param {string} ip IP + port.
   */
  changeIP(ip) {
    this.setState({ ip });
  }

  /**
   * Set `myIp` in storage to `this.state.ip`.
   */
  async setIpInStorage() {
    try {
      await AsyncStorage.setItem('myIp', this.state.ip);
    } catch (error) {
      // Error saving data. Log error, but do nothing otherwise.
      console.log(error);
    }
  }

  /**
   * Load `myIp` from storage into `this.state.ip`.
   */
  async getIpFromStorage() {
    try {
      const ip = await AsyncStorage.getItem('myIp');

      if (this.state.ip == null) {
        this.setState({
          ip: (ip == null) ? DEFAULT_IP : ip
        });
      }
    } catch (error) {
      // Error retrieving data. Do nothing.
    }
  }

  /**
   * Check if we can connect to the ip address at `this.state.ip`. Then redirect to either
   * a "can connect" or "cannot connect" screen.
   */
  async redirectBasedOnReachability() {
    const timeoutTime = 5000;

    console.log('In redirectBasedOnReachability with IP: ' + this.state.ip);

    if (await isIpReachable(this.state.ip, timeoutTime)) {
      this.setIpInStorage();
      this.props.navigation.navigate('Connection Status Screen', { screen: 'roverConnected' });
    } else {
      this.props.navigation.navigate('Connection Status Screen', { screen: 'roverDisconnected' });
    }
  }

  /** Look for the rover at its supported LAN addresses and local host names. */
  async findRover() {
    if (this.state.isFindingRover) {
      return;
    }

    this.setState({
      isFindingRover: true,
      discoveryMessage: 'Searching the local network for RE-RASSOR…'
    });

    const roverIp = await findRover(this.state.ip);

    if (roverIp) {
      this.setState({
        ip: roverIp,
        isFindingRover: false,
        discoveryMessage: `RE-RASSOR found at ${roverIp}`
      });
      await AsyncStorage.setItem('myIp', roverIp);
      return;
    }

    this.setState({
      isFindingRover: false,
      discoveryMessage: 'No rover found. Check Wi-Fi, then enter its IP address manually.'
    });
  }

  render() {
    // I.e., don't do full render if font is still loading...
    if (this.state.isLoading) {
      return <View style={{ flex: 1, backgroundColor: '#5D6061' }} />;
    }

    return (
      <KeyboardAwareScrollView contentContainerStyle={[ControllerStyle.keyboardAwareScrollView]}>
        <View style={ControllerStyle.screenLayout}>

          <StatusBar backgroundColor="#2E3030" barStyle="dark-content" />

          {/* Title container. */}
          <View style={[ControllerStyle.title]}>
            <Text adjustsFontSizeToFit={true} numberOfLines={1} fontSize={normalize(70)} style={[ControllerStyle.titleText]}>
              RE-RASSOR Connect
            </Text>
          </View>

          {/* Body container. */}
          <View style={ControllerStyle.connectionBody}>

            {/* FSI logo. */}
            <Image source={logo} style={ControllerStyle.fsiLogo} />

            {/* Inner-body container. */}
            <View style={[ControllerStyle.containerTwo, ControllerStyle.connectionCard]} >

              {/* Message to user. */}
              <Text
                adjustsFontSizeToFit={true}
                numberOfLines={2}
                style={{
                  display: 'flex',
                  alignSelf: 'center',
                  fontFamily: 'NASA',
                  margin: 10,
                  fontSize: normalize(30, 1.8),
                  color: '#fff'
                }}
              >
                Connect to your RE-RASSOR rover
              </Text>

              {/* Loading dots animation. */}
              <LottieView
                ref={this.animation}
                autoPlay={false}
                style={{ position: 'absolute', width: 300, height: 300, bottom: 5 }}
                resizeMode="cover"
                source={require('ezrassor-app/assets/loading.json')}
              />

              {/* Text input for IP + port. */}
              <TextInput
                ref="myInput"
                fontSize={normalize(45, 1.8)}
                style={ControllerStyle.ipInputBox}
                onChangeText={(text) => this.changeIP(text)}
                value={this.state.ip}
                marginVertical={8}
                disableFullscreenUI={true}
                selectionColor={'white'}
                placeholder="192.168.1.2:8080"
                placeholderTextColor="#aeb5b5"
              />

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={this.state.isFindingRover}
                style={[
                  ControllerStyle.findRoverButton,
                  this.state.isFindingRover && ControllerStyle.findRoverButtonDisabled
                ]}
                onPress={() => this.findRover()}
              >
                <Text style={ControllerStyle.findRoverButtonText}>
                  {this.state.isFindingRover ? 'SEARCHING…' : 'FIND ROVER'}
                </Text>
              </TouchableOpacity>

              <Text
                accessibilityLiveRegion="polite"
                style={ControllerStyle.discoveryMessage}
              >
                {this.state.discoveryMessage || 'Find Rover checks the supported local rover addresses.'}
              </Text>

              {/* Connect button. */}
              <TouchableOpacity
                activeOpacity={0.95}
                backgroundColor="#FFFFFF"
                style={[ControllerStyle.connectButton, ControllerStyle.primaryConnectButton]}
                onPress={() => {
                  this.animation.current?.play();
                  this.redirectBasedOnReachability();
                }}
              >
                <Text style={[ControllerStyle.connectButtonText]}>
                  CONNECT
                </Text>
                <Image source={arrowright} style={ControllerStyle.arrowRight} />
              </TouchableOpacity>

              {/* Open the controls without requiring a live rover connection. */}
              <TouchableOpacity
                activeOpacity={0.88}
                accessibilityLabel="Open control interface in offline preview mode"
                style={ControllerStyle.offlinePreviewButton}
                onPress={() => this.props.navigation.navigate('Controller Screen', { offlineMode: true })}
              >
                <Text style={ControllerStyle.offlinePreviewButtonText}>
                  OPEN CONTROLS OFFLINE
                </Text>
              </TouchableOpacity>

            </View>

            {/* Help button. */}
            <TouchableOpacity
              activeOpacity={0.95}
              style={[ControllerStyle.buttonContainer]}
              onPress={() => {
                this.props.navigation.navigate('Connection Help Screen');
              }}
            >
              <Text adjustsFontSizeToFit={true} numberOfLines={1} style={[ControllerStyle.buttonText]}>
                Help
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </KeyboardAwareScrollView>
    );
  }
}
