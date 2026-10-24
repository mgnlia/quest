package com.grinda.questdemo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Color;
import android.net.Uri;
import android.util.TypedValue;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowWebView;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34)
public class MainActivityTest {

    private static final class Req implements WebResourceRequest {
        private final Uri uri;
        Req(String url) { uri = Uri.parse(url); }
        @Override public Uri getUrl() { return uri; }
        @Override public boolean isForMainFrame() { return true; }
        @Override public boolean isRedirect() { return false; }
        @Override public boolean hasGesture() { return true; }
        @Override public String getMethod() { return "GET"; }
        @Override public Map<String, String> getRequestHeaders() { return Collections.emptyMap(); }
    }

    private MainActivity launch() { return Robolectric.buildActivity(MainActivity.class).setup().get(); }
    private WebView webOf(MainActivity a) {
        View root = ((android.view.ViewGroup) a.findViewById(android.R.id.content)).getChildAt(0);
        assertTrue("content view is a WebView", root instanceof WebView);
        return (WebView) root;
    }
    private static String read(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toString(StandardCharsets.UTF_8.name());
    }

    @Test public void webViewIsConfiguredForTheDemo() {
        WebView web = webOf(launch());
        WebSettings s = web.getSettings();
        assertTrue(s.getJavaScriptEnabled());
        assertTrue(s.getDomStorageEnabled());
        assertEquals(100, s.getTextZoom());
        assertFalse("no file:// access", s.getAllowFileAccess());
        assertFalse(s.getAllowContentAccess());
        assertTrue(s.getUserAgentString().contains("QuestDemo/1.0.0"));
    }

    @Test public void loadsBundledAppFromLocalOrigin() {
        WebView web = webOf(launch());
        ShadowWebView sw = shadowOf(web);
        assertEquals(MainActivity.START_URL, sw.getLastLoadedUrl());
        assertTrue(MainActivity.START_URL.startsWith("https://appassets.androidplatform.net/www/index.html"));
        assertNotNull("native bridge exposed", sw.getJavascriptInterface("QuestNative"));
    }

    @Test public void servesAssetsWithCorrectTypes() throws Exception {
        WebView web = webOf(launch());
        WebViewClient c = shadowOf(web).getWebViewClient();
        WebResourceResponse html = c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/index.html"));
        assertNotNull(html);
        assertEquals("text/html", html.getMimeType());
        assertEquals("utf-8", html.getEncoding());
        String body = read(html.getData());
        assertTrue(body.contains("<title>Quest Demo</title>"));
        assertTrue(body.contains("js/admin.js"));
        assertEquals("*", html.getResponseHeaders().get("Access-Control-Allow-Origin"));

        WebResourceResponse css = c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/css/app.css"));
        assertEquals("text/css", css.getMimeType());
        assertTrue(read(css.getData()).contains("Pretendard Variable"));

        WebResourceResponse js = c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/js/core.js"));
        assertEquals("text/javascript", js.getMimeType());
        assertTrue(read(js.getData()).contains("__questBack"));

        WebResourceResponse font = c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/fonts/PretendardVariable.woff2"));
        assertEquals("font/woff2", font.getMimeType());
        assertNull(font.getEncoding());
        byte[] head = new byte[4];
        assertEquals(4, font.getData().read(head));
        assertEquals("wOF2", new String(head, StandardCharsets.US_ASCII));
    }

    @Test public void everyScriptReferencedByIndexExists() throws Exception {
        WebView web = webOf(launch());
        WebViewClient c = shadowOf(web).getWebViewClient();
        String index = read(c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/index.html")).getData());
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?:src|href)=\"([^\"#:]+)\"").matcher(index);
        int count = 0;
        while (m.find()) {
            WebResourceResponse r = c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/" + m.group(1)));
            assertEquals("asset " + m.group(1), 200, r.getStatusCode());
            count++;
        }
        assertTrue("index references css, font and 6 scripts", count >= 8);
    }

    @Test public void missingAndTraversalAre404AndOtherHostsPassThrough() {
        WebView web = webOf(launch());
        WebViewClient c = shadowOf(web).getWebViewClient();
        assertEquals(404, c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/nope.js")).getStatusCode());
        assertEquals(404, c.shouldInterceptRequest(web, new Req("https://appassets.androidplatform.net/www/../AndroidManifest.xml")).getStatusCode());
        assertNull(c.shouldInterceptRequest(web, new Req("https://example.com/x.js")));
    }

    @Test public void externalLinksOpenInBrowserInternalStayInApp() {
        MainActivity a = launch();
        WebView web = webOf(a);
        WebViewClient c = shadowOf(web).getWebViewClient();
        assertFalse(c.shouldOverrideUrlLoading(web, new Req("https://appassets.androidplatform.net/www/index.html#/u/home")));
        assertTrue(c.shouldOverrideUrlLoading(web, new Req("https://www.example.com/terms")));
        Intent next = shadowOf(a).getNextStartedActivity();
        assertEquals(Intent.ACTION_VIEW, next.getAction());
        assertEquals("www.example.com", next.getData().getHost());
    }

    @Test public void pageFinishedRevealsWebView() {
        WebView web = webOf(launch());
        assertEquals(View.INVISIBLE, web.getVisibility());
        shadowOf(web).getWebViewClient().onPageFinished(web, MainActivity.START_URL);
        assertEquals(View.VISIBLE, web.getVisibility());
    }

    @Test public void bridgeSharesCopiesAndColorsBars() throws Exception {
        MainActivity a = launch();
        Object bridge = shadowOf(webOf(a)).getJavascriptInterface("QuestNative");
        Class<?> k = bridge.getClass();
        assertEquals("1.0.0", k.getMethod("version").invoke(bridge));

        k.getMethod("copy", String.class).invoke(bridge, "0xabc");
        org.robolectric.shadows.ShadowLooper.idleMainLooper();
        ClipboardManager cm = (ClipboardManager) a.getSystemService(Context.CLIPBOARD_SERVICE);
        assertEquals("0xabc", cm.getPrimaryClip().getItemAt(0).getText().toString());

        k.getMethod("share", String.class).invoke(bridge, "Quest Q-2026-0412");
        org.robolectric.shadows.ShadowLooper.idleMainLooper();
        Intent chooser = shadowOf(a).getNextStartedActivity();
        assertEquals(Intent.ACTION_CHOOSER, chooser.getAction());
        Intent inner = chooser.getParcelableExtra(Intent.EXTRA_INTENT, Intent.class);
        assertEquals("Quest Q-2026-0412", inner.getStringExtra(Intent.EXTRA_TEXT));

        k.getMethod("setStatusBar", String.class, boolean.class).invoke(bridge, "#151A30", false);
        org.robolectric.shadows.ShadowLooper.idleMainLooper();
        assertEquals(Color.parseColor("#151A30"), a.getWindow().getStatusBarColor());
        k.getMethod("setStatusBar", String.class, boolean.class).invoke(bridge, "not-a-color", true);
        org.robolectric.shadows.ShadowLooper.idleMainLooper();
        assertEquals("bad colors are ignored", Color.parseColor("#151A30"), a.getWindow().getStatusBarColor());

        Method h = k.getMethod("haptic", String.class);
        h.invoke(bridge, "success");
        h.invoke(bridge, "light");
        org.robolectric.shadows.ShadowLooper.idleMainLooper();
    }

    @Test public void backDefersToWebAppInsteadOfClosing() {
        MainActivity a = launch();
        a.onBackPressed();
        assertFalse("activity waits for the web app's answer", a.isFinishing());
    }

    @Test public void survivesRecreate() {
        org.robolectric.android.controller.ActivityController<MainActivity> ctl = Robolectric.buildActivity(MainActivity.class).setup();
        ctl.recreate();
        assertNotNull(ctl.get().findViewById(android.R.id.content));
        ctl.pause().stop().destroy();
    }

    @Test public void englishLabelByDefault() {
        assertEquals("Quest Demo", RuntimeEnvironment.getApplication().getString(R.string.app_name));
    }

    @Test @Config(qualifiers = "ko") public void koreanLabel() {
        assertEquals("퀘스트 데모", RuntimeEnvironment.getApplication().getString(R.string.app_name));
    }

    private static int isLightTheme(MainActivity a) {
        TypedValue v = new TypedValue();
        Resources.Theme t = a.getTheme();
        assertTrue(t.resolveAttribute(android.R.attr.isLightTheme, v, true));
        return v.data;
    }

    @Test public void dayThemeIsLightSoWebViewReportsLight() {
        assertTrue(isLightTheme(launch()) != 0);
    }

    @Test @Config(qualifiers = "night") public void nightThemeIsDarkSoWebViewReportsDark() {
        MainActivity a = launch();
        assertEquals(0, isLightTheme(a));
        assertEquals(Color.parseColor("#0E1020"), a.getColor(R.color.bg));
    }
}
