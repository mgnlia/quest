package com.grinda.questdemo;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class MimeTest {
    @Test public void webTypes() {
        assertEquals("text/html", Mime.of("www/index.html"));
        assertEquals("text/css", Mime.of("www/css/app.css"));
        assertEquals("text/javascript", Mime.of("www/js/core.js"));
        assertEquals("font/woff2", Mime.of("www/fonts/PretendardVariable.woff2"));
        assertEquals("image/svg+xml", Mime.of("a/b.SVG"));
        assertEquals("text/plain", Mime.of("www/fonts/Pretendard-LICENSE.txt"));
    }
    @Test public void queryStringIgnored() { assertEquals("text/css", Mime.of("www/css/app.css?v=3")); }
    @Test public void unknownIsBinary() { assertEquals("application/octet-stream", Mime.of("x.bin")); }
    @Test public void textDetection() {
        assertTrue(Mime.isText("text/html"));
        assertTrue(Mime.isText("application/json"));
        assertFalse(Mime.isText("font/woff2"));
        assertFalse(Mime.isText("image/png"));
    }
}
