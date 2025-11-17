package com.jde.mainserver.global.url;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * Resolves absolute URLs for static assets.
 * - If FRONT_BASE_URL is provided (custom.front-base-url), it will be used as the base.
 * - Otherwise, the base is derived from the current request (scheme + host[:port]).
 *
 * Rationale:
 * - Frontend <img src> should receive fully-qualified URLs to avoid ambiguity with
 *   proxies or context-paths. Backends commonly serve static assets at '/mbtis/**'.
 */
@Component
public class StaticUrlResolver {

	@Value("${custom.front-base-url:}")
	private String frontBaseUrl;

	public String toAbsolute(String path, HttpServletRequest request) {
		if (path == null || path.isBlank()) return path;
		if (startsWithHttpScheme(path)) return path;

		String normalizedPath = path.startsWith("/") ? path : ("/" + path);
		String base = resolveBaseUrl(request);
		return base + normalizedPath;
	}

	private String resolveBaseUrl(HttpServletRequest request) {
		if (frontBaseUrl != null && !frontBaseUrl.isBlank()) {
			return trimTrailingSlash(frontBaseUrl);
		}
		// Build from the incoming request (MockMvc → http://localhost)
		String built = ServletUriComponentsBuilder.fromRequest(request)
			.replacePath("")
			.replaceQuery(null)
			.build()
			.toUriString();
		return trimTrailingSlash(built);
	}

	private static boolean startsWithHttpScheme(String value) {
		String lower = value.toLowerCase();
		return lower.startsWith("http://") || lower.startsWith("https://");
	}

	private static String trimTrailingSlash(String s) {
		if (s == null || s.isEmpty()) return s;
		return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
	}
}


