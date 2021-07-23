package it.pagopa.io.app;

import androidx.multidex.MultiDexApplication;

import com.robinpowered.react.ScreenBrightness.ScreenBrightnessPackage;
import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
import com.sha256lib.Sha256Package;
import com.kevinejohn.RNMixpanel.RNMixpanel;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.facebook.react.ReactApplication;
import com.swmansion.reanimated.ReanimatedPackage;
import com.reactnativecommunity.clipboard.ClipboardPackage;
import com.reactnativecommunity.cookies.CookieManagerPackage;
import com.reactnativecommunity.cameraroll.CameraRollPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import com.gantix.JailMonkey.JailMonkeyPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import cl.json.RNSharePackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.lewin.qrcode.QRScanReaderPackage;
import com.imagepicker.ImagePickerPackage;
import com.kristiansorens.flagsecure.FlagSecurePackage;
import com.rnfs.RNFSPackage;
import com.levelasquez.androidopensettings.AndroidOpenSettingsPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.calendarevents.CalendarEventsPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.horcrux.svg.SvgPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.masteratul.exceptionhandler.ReactNativeExceptionHandlerPackage;
import org.reactnative.camera.RNCameraPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.oblador.keychain.KeychainPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.instabug.reactlibrary.RNInstabugReactnativePackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import it.ipzs.cieidsdk.native_bridge.CiePackage;
import com.reactnativecommunity.rnpermissions.RNPermissionsPackage;
import com.airbnb.android.react.maps.MapsPackage;
import com.github.reactnativecommunity.location.RNLocationPackage;

import com.facebook.react.PackageList;
import android.content.Context;
import com.facebook.react.ReactInstanceManager;
import java.lang.reflect.InvocationTargetException;


import java.util.Arrays;
import java.util.List;

public class MainApplication extends MultiDexApplication implements ReactApplication {


  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(new MainReactPackage(),
            new ClipboardPackage(),
            new ReanimatedPackage(),
            new CookieManagerPackage(),
            new CameraRollPackage(),
            new RNViewShotPackage(),
            new JailMonkeyPackage(),
            new LinearGradientPackage(),
            new MapsPackage(),
            new RNLocationPackage(),
            new RNSharePackage(), new ScreenBrightnessPackage(), new AsyncStoragePackage(), new QRScanReaderPackage(),
          new ImagePickerPackage(), new FlagSecurePackage(), new RNFSPackage(), new AndroidOpenSettingsPackage(),
          new RNGestureHandlerPackage(), new CalendarEventsPackage(), new RNCWebViewPackage(),
          new FingerprintAuthPackage(), new BackgroundTimerPackage(), new SvgPackage(),
          new SplashScreenReactPackage(), new ReactNativeExceptionHandlerPackage(), new RNCameraPackage(),
          new ReactNativePushNotificationPackage(), new KeychainPackage(), new RNI18nPackage(), new Sha256Package(),
          new RNMixpanel(), new RNDeviceInfo(), new ReactNativeConfigPackage(),new CiePackage(),new RNPermissionsPackage(),
          new RNInstabugReactnativePackage.Builder(BuildConfig.INSTABUG_TOKEN, MainApplication.this)
              .setInvocationEvent("none").setPrimaryColor("#0073E6").build());
    }

  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {

    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }


   /**
    * Loads Flipper in React Native templates. Call this in the onCreate method with something like
    * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    *
    * @param context
    * @param reactInstanceManager
    */
   private static void initializeFlipper(
       Context context, ReactInstanceManager reactInstanceManager) {
     if (BuildConfig.DEBUG) {
       try {
         /*
          We use reflection here to pick up the class that initializes Flipper,
         since Flipper library is not available in release mode
         */
         Class<?> aClass = Class.forName("it.pagopa.io.app");
         aClass
           .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
           .invoke(null, context, reactInstanceManager);
       } catch (ClassNotFoundException e) {
         e.printStackTrace();
       } catch (NoSuchMethodException e) {
         e.printStackTrace();
       } catch (IllegalAccessException e) {
         e.printStackTrace();
       } catch (InvocationTargetException e) {
         e.printStackTrace();
       }
     }
   }

}
