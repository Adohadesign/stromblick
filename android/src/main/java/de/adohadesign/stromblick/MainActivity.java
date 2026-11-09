package de.adohadesign.stromblick;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.core.content.FileProvider;
import java.io.OutputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final int REQUEST_FILE = 601;
    private static final int REQUEST_BACKUP = 602;
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/www/index.html";
    private WebView webView;
    private ValueCallback<Uri[]> pendingFileChoice;
    private Uri pendingCameraImage;
    private File pendingCameraFile;
    private byte[] pendingBackup;

    private final class BackupBridge {
        @JavascriptInterface
        public void saveBackup(String json, String filename) {
            if (json == null || json.length() > 3000000) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Backup zu groß oder ungültig.", Toast.LENGTH_LONG).show());
                return;
            }
            runOnUiThread(() -> {
                if (pendingBackup != null) {
                    Toast.makeText(MainActivity.this, "Bitte zuerst die laufende Sicherung abschließen.", Toast.LENGTH_LONG).show();
                    return;
                }
                pendingBackup = json.getBytes(StandardCharsets.UTF_8);
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                save.addCategory(Intent.CATEGORY_OPENABLE);
                save.setType("application/json");
                save.putExtra(Intent.EXTRA_TITLE, "StromBlick_Backup.json");
                try { startActivityForResult(save, REQUEST_BACKUP); }
                catch (ActivityNotFoundException ex) {
                    pendingBackup = null;
                    Toast.makeText(MainActivity.this, "Dateiauswahl ist nicht verfügbar.", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(12,18,32));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(12,18,32));
        webView = new WebView(this);
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.addJavascriptInterface(new BackupBridge(), "StromBlickNative");
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost()) && "https".equals(url.getScheme())) return false;
                if ("https".equals(url.getScheme()) || "http".equals(url.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, url)); }
                    catch (ActivityNotFoundException ignored) {}
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileChoice != null) pendingFileChoice.onReceiveValue(null);
                pendingFileChoice = callback;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                String[] types = params.getAcceptTypes();
                boolean photo = types != null && types.length > 0 && types[0].startsWith("image/");
                pick.setType(photo ? "image/*" : "*/*");
                Intent chooser = Intent.createChooser(pick, photo ? "Zählerfoto auswählen" : "Sicherung auswählen");
                if (photo) {
                    Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    Uri image = createCameraImage();
                    if (image != null) {
                        pendingCameraImage = image;
                        camera.putExtra(MediaStore.EXTRA_OUTPUT, image);
                        camera.setClipData(ClipData.newUri(getContentResolver(), "StromBlick Zaehlerfoto", image));
                        camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
                    }
                }
                try { startActivityForResult(chooser, REQUEST_FILE); }
                catch (ActivityNotFoundException ex) {
                    pendingFileChoice.onReceiveValue(null);
                    pendingFileChoice=null;
                    Toast.makeText(MainActivity.this, "Dateiauswahl ist nicht verfügbar.", Toast.LENGTH_LONG).show();
                }
                return true;
            }
        });
        if (state == null) webView.loadUrl(APP_URL);
        else webView.restoreState(state);
    }

    private Uri createCameraImage() {
        try {
            File dir = new File(getCacheDir(), "meter-photos");
            if (!dir.exists() && !dir.mkdirs()) return null;
            pendingCameraFile = File.createTempFile("meter-", ".jpg", dir);
            return FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", pendingCameraFile);
        } catch (Exception e) {
            pendingCameraFile = null;
            return null;
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_FILE) {
            Uri[] result = null;
            if (resultCode == RESULT_OK) {
                if (data != null && data.getData() != null) result = new Uri[]{data.getData()};
                else if (pendingCameraImage != null) result = new Uri[]{pendingCameraImage};
            }
            if (pendingFileChoice != null) pendingFileChoice.onReceiveValue(result);
            pendingFileChoice = null;
            if (pendingCameraImage != null && (result == null || result[0] == null || !pendingCameraImage.equals(result[0]))) {
                if (pendingCameraFile != null) pendingCameraFile.delete();
            }
            pendingCameraImage = null;
            pendingCameraFile = null;
        } else if (requestCode == REQUEST_BACKUP) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingBackup != null) {
                try (OutputStream output = getContentResolver().openOutputStream(data.getData())) {
                    if (output == null) throw new IllegalStateException("Kein Schreibzugriff");
                    output.write(pendingBackup);
                    output.flush();
                    Toast.makeText(this, "Backup gespeichert.", Toast.LENGTH_LONG).show();
                } catch (Exception ex) {
                    Toast.makeText(this, "Backup fehlgeschlagen. Bitte erneut versuchen.", Toast.LENGTH_LONG).show();
                }
            }
            pendingBackup = null;
        }
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }
    @Override protected void onDestroy() {
        if (pendingFileChoice != null) { pendingFileChoice.onReceiveValue(null); pendingFileChoice=null; }
        if (webView != null) { webView.destroy(); webView=null; }
        super.onDestroy();
    }
    @Override public void onBackPressed() {
        webView.evaluateJavascript("(function(){var d=document.querySelector('dialog[open]');if(d){d.close();return true;}return false;})()", value -> {
            if (!"true".equals(value)) {
                if (webView.canGoBack()) webView.goBack();
                else MainActivity.super.onBackPressed();
            }
        });
    }
}
