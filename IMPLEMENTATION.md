### **Project Analemma: Implementation Guide v1.0**

#### 1.0 Technology Stack & Architecture

**Core Technologies:**
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PWA**: Service Worker, Web App Manifest
- **Build Tools**: Node.js script for data generation
- **Testing**: Jest for unit tests, Playwright for integration tests
- **Visualization**: SVG for graphics rendering

#### 2.0 Analemma Coordinate System

**Chosen System: Equation of Time vs Solar Declination**
- **X-axis**: Equation of Time (minutes) - range: approximately -16 to +14 minutes
- **Y-axis**: Solar Declination (degrees) - range: approximately -23.5° to +23.5°

**Benefits:**
- Creates authentic figure-8 shape matching astronomical photography
- Location-independent analemma shape
- Easy hemisphere handling via Y-axis inversion
- Real astronomical meaning

**Data Generation:**
- Node.js script calculates 366 coordinate pairs (accounting for leap years)
- Output: JSON file with `{day_of_year: [equation_of_time, solar_declination]}`
- Pre-calculated during development, bundled with PWA

#### 3.0 Solar Calculations

**Required Algorithms:**
- Solar declination calculation
- Equation of time calculation  
- Solar noon time calculation based on longitude
- Solar elevation angle (for extreme latitude detection)

**Precision Target:** ±1-2 minutes accuracy

#### 4.0 Visual Design Specifications

**Color Scheme:**
- **Background**: Blue sky gradient (normal latitudes)
- **Background (Extreme)**: Blue-to-black gradient (sun below horizon)
- **Analemma Path**: Comfortable blue color, clean continuous line
- **Sun Icon**: Custom SVG with solar styling

**Layout:**
1. **Top**: Solar noon time display
2. **Middle**: Analemma visualization (SVG)
3. **Bottom**: 3D directional arrow (tilted custom SVG)

**Hemisphere Handling:**
- Northern Hemisphere (lat > 0°): Standard orientation, arrow points South
- Southern Hemisphere (lat < 0°): Y-axis inverted, arrow points North
- Equator (lat = 0°): Standard orientation, arrow points North

#### 5.0 Extreme Latitude Handling

**Detection**: Solar elevation at noon < 0°
**Response:**
- Switch to blue-to-black gradient background
- Display message: "The sun is below the horizon at solar noon"
- Continue showing analemma position for educational value

#### 6.0 Error Handling & Edge Cases

**Location Permission Denied:**
- Display apologetic message
- Provide button to re-request permission
- Clear instructions on why location is needed

**Calculation Errors:**
- Comprehensive input validation
- Fallback to reasonable defaults where possible
- User-friendly error messages

**Network Issues:**
- Full offline functionality after first load
- Cached location data and resources

#### 7.0 Testing Strategy

**Unit Tests:**
- Astronomical calculation functions
- Coordinate system transformations
- Date/time utilities
- Hemisphere detection logic

**Integration Tests:**
- Location permission flow
- Offline functionality
- PWA installation
- Cross-browser compatibility

**Data Validation Tests:**
- Verify analemma coordinate accuracy
- Test edge cases (leap years, extreme dates)
- Validate solar noon calculations against known values

#### 8.0 Project Structure

```
analemma-pwa/
├── src/
│   ├── js/
│   │   ├── calculations/
│   │   │   ├── solar.js
│   │   │   └── analemma.js
│   │   ├── ui/
│   │   │   ├── display.js
│   │   │   └── visualization.js
│   │   ├── utils/
│   │   │   └── location.js
│   │   └── app.js
│   ├── css/
│   │   └── styles.css
│   ├── assets/
│   │   ├── icons/
│   │   └── analemma-data.json
│   └── index.html
├── tools/
│   └── generate-analemma-data.js
├── tests/
│   ├── unit/
│   └── integration/
├── manifest.json
├── sw.js (service worker)
└── package.json
```

#### 9.0 Development Phases

**Phase 1: Core Setup**
- Project structure
- PWA manifest and service worker
- Basic HTML/CSS layout

**Phase 2: Astronomical Engine**
- Solar calculation functions
- Analemma data generation script
- Unit tests for calculations

**Phase 3: Visualization**
- SVG analemma rendering
- Sun position marker
- Hemisphere-aware display

**Phase 4: User Interface**
- Location permission handling
- Time display formatting
- Directional arrow with 3D styling

**Phase 5: PWA Features**
- Offline functionality
- Installation prompts
- Performance optimization

**Phase 6: Testing & Polish**
- Comprehensive test suite
- Cross-browser testing
- UI/UX refinements 