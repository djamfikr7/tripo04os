import 'package:flutter/material.dart';

/// BMAD Phase 3: Prototype
/// Theme configuration for Tripo04OS Rider App
/// BMAD Principle: Consistent visual identity enhances brand recognition and user trust
class ThemeConfig {
  // BMAD Principle: Primary brand color for strong visual identity
  static const Color primaryColor = Color(0xFF0066FF);
  static const Color primaryDark = Color(0xFF0044CC);
  static const Color primaryLight = Color(0xFF3399FF);
  
  // BMAD Principle: Secondary color for accent elements
  static const Color secondaryColor = Color(0xFFFF6B35);
  static const Color secondaryDark = Color(0xFFCC5529);
  static const Color secondaryLight = Color(0xFFFF8A5D);
  
  // BMAD Principle: Success color for positive feedback
  static const Color successColor = Color(0xFF00C853);
  static const Color successDark = Color(0xFF009624);
  static const Color successLight = Color(0xFF69F0AE);
  
  // BMAD Principle: Warning color for attention-grabbing elements
  static const Color warningColor = Color(0xFFFFAB00);
  static const Color warningDark = Color(0xFFC68400);
  static const Color warningLight = Color(0xFFFFD54F);
  
  // BMAD Principle: Error color for clear error communication
  static const Color errorColor = Color(0xFFFF1744);
  static const Color errorDark = Color(0xFFD50000);
  static const Color errorLight = Color(0xFFFF8A80);
  
  // BMAD Principle: Neutral colors for content hierarchy
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textTertiary = Color(0xFF9E9E9E);
  static const Color textDisabled = Color(0xFFBDBDBD);
  
  // BMAD Principle: Background colors for visual depth
  static const Color backgroundPrimary = Color(0xFFFFFFFF);
  static const Color backgroundSecondary = Color(0xFFF5F5F5);
  static const Color backgroundTertiary = Color(0xFFEEEEEE);
  
  // BMAD Principle: Divider colors for visual separation
  static const Color dividerColor = Color(0xFFE0E0E0);
  static const Color dividerLight = Color(0xFFF0F0F0);
  
  // BMAD Principle: Shadow colors for depth perception
  static const Color shadowLight = Color(0x1A000000);
  static const Color shadowMedium = Color(0x33000000);
  static const Color shadowDark = Color(0x4D000000);
  
  // BMAD Principle: Overlay colors for focus states
  static const Color overlayLight = Color(0x0A000000);
  static const Color overlayMedium = Color(0x1A000000);
  static const Color overlayDark = Color(0x33000000);
  
  /// BMAD Phase 5: Implement
  /// Light theme configuration
  /// BMAD Principle: Light theme for optimal readability in bright environments
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      
      // BMAD Principle: Primary color scheme
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        onPrimary: Colors.white,
        primaryContainer: primaryLight,
        onPrimaryContainer: primaryDark,
        secondary: secondaryColor,
        onSecondary: Colors.white,
        secondaryContainer: secondaryLight,
        onSecondaryContainer: secondaryDark,
        tertiary: successColor,
        onTertiary: Colors.white,
        error: errorColor,
        onError: Colors.white,
        errorContainer: errorLight,
        onErrorContainer: errorDark,
        surface: backgroundPrimary,
        onSurface: textPrimary,
        surfaceVariant: backgroundSecondary,
        onSurfaceVariant: textSecondary,
        outline: dividerColor,
        outlineVariant: dividerLight,
        shadow: shadowMedium,
        scrim: overlayDark,
        inverseSurface: textPrimary,
        onInverseSurface: backgroundPrimary,
        inversePrimary: primaryLight,
      ),
      
      // BMAD Principle: Typography for clear content hierarchy
      textTheme: _buildTextTheme(Brightness.light),
      
      // BMAD Principle: App bar theme for consistent navigation
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: textPrimary,
        iconTheme: IconThemeData(color: textPrimary),
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
      ),
      
      // BMAD Principle: Card theme for visual consistency
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: backgroundPrimary,
        shadowColor: shadowLight,
      ),
      
      // BMAD Principle: Elevated button theme for primary actions
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // BMAD Principle: Outlined button theme for secondary actions
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: const BorderSide(color: primaryColor, width: 2),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // BMAD Principle: Text button theme for tertiary actions
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      
      // BMAD Principle: Input decoration theme for form fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundSecondary,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        hintStyle: TextStyle(
          color: textTertiary,
          fontSize: 16,
        ),
        labelStyle: TextStyle(
          color: textSecondary,
          fontSize: 14,
        ),
      ),
      
      // BMAD Principle: Icon theme for consistent icon styling
      iconTheme: const IconThemeData(
        color: textSecondary,
        size: 24,
      ),
      
      // BMAD Principle: Divider theme for visual separation
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      ),
      
      // BMAD Principle: Floating action button theme for quick actions
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
      
      // BMAD Principle: Bottom navigation bar theme for navigation
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        elevation: 8,
        backgroundColor: backgroundPrimary,
        selectedItemColor: primaryColor,
        unselectedItemColor: textTertiary,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.normal,
        ),
      ),
      
      // BMAD Principle: Chip theme for tags and filters
      chipTheme: ChipThemeData(
        backgroundColor: backgroundSecondary,
        deleteIconColor: textSecondary,
        disabledColor: backgroundTertiary,
        selectedColor: primaryLight,
        secondarySelectedColor: secondaryLight,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        labelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      
      // BMAD Principle: Dialog theme for modal interactions
      dialogTheme: DialogTheme(
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        contentTextStyle: const TextStyle(
          fontSize: 16,
          color: textSecondary,
        ),
      ),
      
      // BMAD Principle: Snackbar theme for notifications
      snackBarTheme: SnackBarThemeData(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
        contentTextStyle: const TextStyle(
          fontSize: 14,
          color: Colors.white,
        ),
      ),
      
      // BMAD Principle: Bottom sheet theme for bottom-up interactions
      bottomSheetTheme: const BottomSheetThemeData(
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        backgroundColor: backgroundPrimary,
      ),
      
      // BMAD Principle: Tab bar theme for tab navigation
      tabBarTheme: const TabBarTheme(
        labelColor: primaryColor,
        unselectedLabelColor: textTertiary,
        labelStyle: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.normal,
        ),
        indicator: UnderlineTabIndicator(
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
      ),
      
      // BMAD Principle: Switch theme for toggle controls
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryColor;
          }
          return textTertiary;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryLight;
          }
          return backgroundTertiary;
        }),
      ),
      
      // BMAD Principle: Checkbox theme for selection controls
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryColor;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(4),
        ),
      ),
      
      // BMAD Principle: Radio button theme for selection controls
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryColor;
          }
          return Colors.transparent;
        }),
      ),
      
      // BMAD Principle: Slider theme for range selection
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryColor,
        inactiveTrackColor: backgroundTertiary,
        thumbColor: primaryColor,
        overlayColor: primaryLight,
        trackHeight: 4,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
      ),
      
      // BMAD Principle: Progress indicator theme for loading states
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryColor,
        linearTrackColor: backgroundTertiary,
        circularTrackColor: backgroundTertiary,
      ),
      
      // BMAD Principle: Tooltip theme for contextual information
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: textPrimary,
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          fontSize: 12,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }
  
  /// BMAD Phase 5: Implement
  /// Dark theme configuration
  /// BMAD Principle: Dark theme for optimal readability in low-light environments
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // BMAD Principle: Dark color scheme
      colorScheme: const ColorScheme.dark(
        primary: primaryLight,
        onPrimary: textPrimary,
        primaryContainer: primaryDark,
        onPrimaryContainer: primaryLight,
        secondary: secondaryLight,
        onSecondary: textPrimary,
        secondaryContainer: secondaryDark,
        onSecondaryContainer: secondaryLight,
        tertiary: successLight,
        onTertiary: textPrimary,
        error: errorLight,
        onError: textPrimary,
        errorContainer: errorDark,
        onErrorContainer: errorLight,
        surface: Color(0xFF121212),
        onSurface: Colors.white,
        surfaceVariant: Color(0xFF1E1E1E),
        onSurfaceVariant: Colors.grey[400],
        outline: Color(0xFF333333),
        outlineVariant: Color(0xFF2A2A2A),
        shadow: shadowMedium,
        scrim: overlayDark,
        inverseSurface: Colors.white,
        onInverseSurface: textPrimary,
        inversePrimary: primaryDark,
      ),
      
      // BMAD Principle: Dark theme typography
      textTheme: _buildTextTheme(Brightness.dark),
      
      // BMAD Principle: Dark theme app bar
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        iconTheme: IconThemeData(color: Colors.white),
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      
      // BMAD Principle: Dark theme card
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: const Color(0xFF1E1E1E),
        shadowColor: shadowLight,
      ),
      
      // BMAD Principle: Dark theme input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF2A2A2A),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryLight, width: 2),
        ),
        hintStyle: TextStyle(
          color: Colors.grey[600],
          fontSize: 16,
        ),
        labelStyle: TextStyle(
          color: Colors.grey[400],
          fontSize: 14,
        ),
      ),
    );
  }
  
  /// BMAD Phase 5: Implement
  /// Build text theme based on brightness
  /// BMAD Principle: Typography hierarchy for clear content organization
  static TextTheme _buildTextTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : textPrimary;
    final secondaryTextColor = isDark ? Colors.grey[400] : textSecondary;
    
    return TextTheme(
      // BMAD Principle: Display typography for headings
      displayLarge: TextStyle(
        fontSize: 57,
        fontWeight: FontWeight.w400,
        color: textColor,
        letterSpacing: -0.25,
      ),
      displayMedium: TextStyle(
        fontSize: 45,
        fontWeight: FontWeight.w400,
        color: textColor,
      ),
      displaySmall: TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.w400,
        color: textColor,
      ),
      
      // BMAD Principle: Headline typography for section titles
      headlineLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      headlineSmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      
      // BMAD Principle: Title typography for card titles
      titleLarge: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: textColor,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: textColor,
        letterSpacing: 0.15,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textColor,
        letterSpacing: 0.1,
      ),
      
      // BMAD Principle: Body typography for content
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textColor,
        letterSpacing: 0.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textColor,
        letterSpacing: 0.25,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: secondaryTextColor,
        letterSpacing: 0.4,
      ),
      
      // BMAD Principle: Label typography for labels and captions
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textColor,
        letterSpacing: 0.1,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: textColor,
        letterSpacing: 0.5,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: secondaryTextColor,
        letterSpacing: 0.5,
      ),
    );
  }
}
