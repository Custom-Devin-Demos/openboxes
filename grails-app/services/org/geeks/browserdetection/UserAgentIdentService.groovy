package org.geeks.browserdetection

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

import org.springframework.web.context.request.RequestContextHolder

import eu.bitwalker.useragentutils.Browser
import eu.bitwalker.useragentutils.BrowserType
import eu.bitwalker.useragentutils.DeviceType
import eu.bitwalker.useragentutils.OperatingSystem
import eu.bitwalker.useragentutils.RenderingEngine
import eu.bitwalker.useragentutils.UserAgent

class UserAgentIdentService {

	static transactional = false

	public static final String CHROME = "chrome"
	public static final String FIREFOX = "firefox"
	public static final String SAFARI = "safari"
	public static final String OTHER = "other"
	public static final String MSIE = "msie"
	public static final String UNKNOWN = "unknown"
	public static final String BLACKBERRY = "blackberry"
	public static final String SEAMONKEY = "seamonkey"
	public static final String OPERA = "opera"

	public static final int CLIENT_CHROME = 0
	public static final int CLIENT_FIREFOX = 1
	public static final int CLIENT_SAFARI = 2
	public static final int CLIENT_OTHER = 3
	public static final int CLIENT_MSIE = 4
	public static final int CLIENT_UNKNOWN = 5
	public static final int CLIENT_BLACKBERRY = 6
	public static final int CLIENT_SEAMONKEY = 7
	public static final int CLIENT_OPERA = 8

	public static final String AGENT_INFO_TOKEN = "${this.name}_agentInfo"

	public static final List<OperatingSystem> MOBILE_BROWSERS = [
		OperatingSystem.iOS4_IPHONE, OperatingSystem.iOS5_IPHONE, OperatingSystem.MAC_OS_X_IPAD,
		OperatingSystem.MAC_OS_X_IPHONE, OperatingSystem.MAC_OS_X_IPOD, OperatingSystem.BADA, OperatingSystem.PSP]

	public static final List<OperatingSystem> MOBILE_BROWSER_GROUPS = [
		OperatingSystem.ANDROID, OperatingSystem.BLACKBERRY, OperatingSystem.KINDLE, OperatingSystem.SYMBIAN]

	private static final List<OperatingSystem> IOS = [
		OperatingSystem.MAC_OS_X_IPHONE, OperatingSystem.iOS4_IPHONE, OperatingSystem.iOS5_IPHONE, OperatingSystem.iOS6_IPHONE,
		OperatingSystem.iOS7_IPHONE, OperatingSystem.iOS8_IPHONE, OperatingSystem.iOS8_1_IPHONE]

	private static final List<OperatingSystem> IPAD = [
		OperatingSystem.MAC_OS_X_IPAD, OperatingSystem.iOS6_IPAD, OperatingSystem.iOS7_IPAD,
		OperatingSystem.iOS8_IPAD, OperatingSystem.iOS8_1_IPAD]

	private static final List<OperatingSystem> WINDOWS_MOBILE = [
		OperatingSystem.WINDOWS_MOBILE, OperatingSystem.WINDOWS_MOBILE7,
		OperatingSystem.WINDOWS_PHONE8, OperatingSystem.WINDOWS_PHONE8_1]

	/**
	 * Returns user-agent header value from thread-bound RequestContextHolder
	 */
	String getUserAgentString() {
		getUserAgentString request
	}

	/**
	 * Returns user-agent header value from the passed request
	 */
	String getUserAgentString(request) {
		request.getHeader("user-agent")
	}

	UserAgent getUserAgent() {

		String userAgentString = getUserAgentString()
		UserAgent userAgent = request.session.getAttribute(AGENT_INFO_TOKEN)

		// returns cached instance
		if (userAgent && userAgent.userAgentString == userAgentString) {
			return userAgent
		}

		if (userAgent && userAgent.userAgentString != userAgent) {
			log.warn "User agent string has changed in a single session!"
			log.warn "Previous User Agent: $userAgent.userAgentString"
			log.warn "New User Agent: $userAgentString"
			log.warn "Discarding existing agent info and creating new..."
		}
		else {
			log.debug "User agent info does not exist in session scope, creating..."
		}

		// fallback for users without user-agent header
		if (userAgentString == null) {
			log.warn "User agent header is not set"
			userAgentString = ""
		}

		userAgent = parseUserAgent(userAgentString)

		request.session.setAttribute(AGENT_INFO_TOKEN, userAgent)
		return userAgent
	}

	UserAgent parseUserAgent(String userAgentString) {
		UserAgent.parseUserAgentString(userAgentString)
	}

	boolean isChrome(ComparisonType comparisonType = null, String version = null) {
		isBrowser(Browser.CHROME, comparisonType, version)
	}

	boolean isFirefox(ComparisonType comparisonType = null, String version = null) {
		isBrowser(Browser.FIREFOX, comparisonType, version)
	}

	boolean isMsie(ComparisonType comparisonType = null, String version = null) {
		// why people use it?
		isBrowser(Browser.IE, comparisonType, version)
	}

	boolean isSafari(ComparisonType comparisonType = null, String version = null) {
		isBrowser(Browser.SAFARI, comparisonType, version)
	}

	boolean isOpera(ComparisonType comparisonType = null, String version = null) {
		isBrowser(Browser.OPERA, comparisonType, version)
	}

	/**
	 * Returns true if browser is unknown
	 */
	boolean isOther() {
		isBrowser(Browser.UNKNOWN)
	}

	private boolean isBrowser(Browser browserForChecking, ComparisonType comparisonType = null, String version = null) {
		UserAgent userAgent = getUserAgent()
		Browser browser = userAgent.browser

		// browser checking
		if (!(browser.group == browserForChecking || browser == browserForChecking)) {
			return false
		}

		// version checking
		if (version) {
			if (!comparisonType) {
				throw new IllegalArgumentException("comparisonType must be specified")
			}

            if (userAgent.browserVersion?.version) {

                if (comparisonType == ComparisonType.EQUAL) {
                    return VersionHelper.equals(userAgent.browserVersion?.version, version)
                }

                int compRes = VersionHelper.compare(userAgent.browserVersion?.version, version)

                if (compRes == 1 && comparisonType == ComparisonType.GREATER) {
                    return true
                }

                if (compRes == -1 && comparisonType == ComparisonType.LOWER) {
                    return true
    			}

            }

            return false
		}

		true
	}

	private boolean isOs(OperatingSystem osForChecking) {
		OperatingSystem os = userAgent.operatingSystem
		os.group == osForChecking || os == osForChecking
	}

	boolean isiPhone() {
		def os = getUserAgent().operatingSystem

		os in [ OperatingSystem.MAC_OS_X_IPHONE,
				OperatingSystem.iOS4_IPHONE,
				OperatingSystem.iOS5_IPHONE,
				OperatingSystem.iOS6_IPHONE,
				OperatingSystem.iOS7_IPHONE,
				OperatingSystem.iOS8_IPHONE,
				OperatingSystem.iOS8_1_IPHONE,
				OperatingSystem.iOS8_2_IPHONE,
				OperatingSystem.iOS8_3_IPHONE,
				OperatingSystem.iOS8_4_IPHONE,
				OperatingSystem.iOS9_IPHONE ]
	}

	boolean isiPad() {
		def os = getUserAgent().operatingSystem
		os in [ OperatingSystem.MAC_OS_X_IPAD,
				OperatingSystem.iOS6_IPAD,
				OperatingSystem.iOS7_IPAD,
				OperatingSystem.iOS8_IPAD,
				OperatingSystem.iOS8_1_IPAD,
				OperatingSystem.iOS8_2_IPAD,
				OperatingSystem.iOS8_3_IPAD,
				OperatingSystem.iOS8_4_IPAD,
				OperatingSystem.iOS9_IPAD ]
	}

	boolean isiOsDevice() {
		isOs(OperatingSystem.IOS)
	}

	boolean isAndroid() {
		isOs(OperatingSystem.ANDROID)
	}

	boolean isAndroidTablet() {
		isOs(OperatingSystem.ANDROID) && isDeviceType(DeviceType.TABLET)
	}

	boolean isTablet() {
		isDeviceType DeviceType.TABLET
	}

	boolean isPalm() {
		isOs(OperatingSystem.PALM)
	}

	boolean isLinux() {
		isOs(OperatingSystem.LINUX)
	}

	boolean isWindows() {
		isOs(OperatingSystem.WINDOWS)
	}

	boolean isOSX() {
		isOs(OperatingSystem.MAC_OS_X)
	}

	boolean isWebkit() {
		userAgent.browser.renderingEngine == RenderingEngine.WEBKIT
	}

	boolean isWindowsMobile() {
		def os = getUserAgent().operatingSystem
		os in [ OperatingSystem.WINDOWS_MOBILE, OperatingSystem.WINDOWS_MOBILE7, OperatingSystem.WINDOWS_PHONE8, OperatingSystem.WINDOWS_PHONE8_1, OperatingSystem.WINDOWS_10_MOBILE ]
	}

	boolean isWindowsPhone() {
		isWindowsMobile()
	}

	boolean isBlackberry() {
		isOs(OperatingSystem.BLACKBERRY)
	}

	boolean isSeamonkey() {
		isBrowser(Browser.SEAMONKEY)
	}

	/**
	 * Returns true if client is a mobile phone or any Android device, iPhone, iPad, iPod, PSP, Blackberry, Bada device
	 */
	boolean isMobile() {
		def userAgent = getUserAgent()
		def os = userAgent.operatingSystem

		userAgent.browser.browserType == BrowserType.MOBILE_BROWSER || os in MOBILE_BROWSERS ||
				(os.group && os.group in MOBILE_BROWSER_GROUPS) || isiOsDevice()
	}

	boolean isRobot() {
		userAgent.browser.browserType == BrowserType.ROBOT
	}

	/**
	 * Returns the browser name.
	 */
	String getBrowser() {
		userAgent.browser.name
	}

	/**
	 * It is left for compatibility reasons. Use {@link #getBrowser() } instead.
	 */
	@Deprecated
	String getBrowserName() {
		switch (getBrowserType()) {
			case CLIENT_FIREFOX:    return FIREFOX
			case CLIENT_CHROME:     return CHROME
			case CLIENT_SAFARI:     return SAFARI
			case CLIENT_SEAMONKEY:  return SEAMONKEY
			case CLIENT_MSIE:       return MSIE
			case CLIENT_BLACKBERRY: return BLACKBERRY
			case CLIENT_OPERA:      return OPERA
			default:                return OTHER
		}
	}

	String getBrowserVersion() {
		userAgent?.browserVersion?.version
	}

	String getOperatingSystem() {
		userAgent?.operatingSystem?.name
	}

	@Deprecated
	String getPlatform() {
		userAgent.operatingSystem
	}

	/**
	 * Internet Explorer specific.
	 */
	@Deprecated
	String getSecurity() {
		throw new UnsupportedOperationException()
	}

	@Deprecated
	String getLanguage() {
		throw new UnsupportedOperationException()
	}

	@Deprecated
	int getBrowserType() {
		def browser = userAgent.browser
		browser = browser.group ?: browser

		switch (browser) {
			case Browser.FIREFOX:   return CLIENT_FIREFOX
			case Browser.CHROME:    return CLIENT_CHROME
			case Browser.SAFARI:    return CLIENT_SAFARI
			case Browser.SEAMONKEY: return CLIENT_SEAMONKEY
			case Browser.IE:        return CLIENT_MSIE
			case Browser.OPERA:     return CLIENT_OPERA
		}

		if (userAgent.operatingSystem == OperatingSystem.BLACKBERRY) {
			return CLIENT_BLACKBERRY
		}

		return CLIENT_OTHER
	}

	/**
	 * It is left for compatibility reasons.
	 */
	@Deprecated
	def getUserAgentInfo() {
		def userAgent = getUserAgent()
		[browserType: browserType,
		 browserVersion: userAgent.browserVersion?.version,
		 operatingSystem: userAgent.operatingSystem?.name,
		 platform: "",
		 security: "",
		 language: "",
		 agentString: userAgent.userAgentString]
	}

	private HttpServletRequest getRequest() {
		RequestContextHolder.currentRequestAttributes().currentRequest
	}

	private HttpServletResponse getSession() {
		RequestContextHolder.currentRequestAttributes().session
	}

	private boolean isDeviceType(DeviceType type) {
		userAgent.operatingSystem.deviceType == type
	}

}
