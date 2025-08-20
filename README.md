# Office Heatmap

A real-time office temperature heatmap application built with Ruby on Rails that allows users to vote on temperature comfort levels in different areas of the office and visualize temperature zones through an interactive heatmap.

## Features

- **Interactive Temperature Heatmap**: Real-time visualization of temperature comfort zones across the office
- **Temperature Voting System**: Users can vote on whether areas are too hot, too cold, or comfortable
- **Admin Panel**: Secure admin interface for managing floorplans
- **Real-time Updates**: Live updates using Action Cable
- **Responsive Design**: Modern UI built with Tailwind CSS
- **PWA Support**: Progressive Web App capabilities

## Prerequisites

- Ruby 3.0 or higher
- PostgreSQL 9.3 or higher
- Node.js 16 or higher
- Yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/viamin/office-heatmap
   cd office-heatmap
   ```

2. **Run the setup script**
   ```bash
   bin/setup
   ```

3. **Start the development server**
   ```bash
   bin/dev
   ```

The application will be available at `http://localhost:4000`



## Admin Access

### How to Log In as Admin

1. Navigate to `http://localhost:4000`
2. Click on the "Sign in" link in the navigation (if visible) or go to `/admins/sign_in`
3. Enter your admin credentials
4. Click "Sign in"

## Managing Floorplans

### Adding a Floorplan

1. **Log in as an admin** (see Admin Access section above)

2. **Navigate to the floorplan upload page**
   - From the main page, click "Upload floorplan" in the top navigation
   - Or go directly to `/floorplan/upload`

3. **Fill in the floorplan details**:
   - **Name**: A descriptive name for the floorplan (e.g., "Main Office - 2nd Floor")
   - **Image**: Upload a floorplan image file (PNG, JPG, etc.)

4. **Save the floorplan**
   - Click "Save" to upload and save the floorplan
   - You'll be redirected to the main heatmap view

### Updating an Existing Floorplan

1. Log in as an admin
2. Navigate to `/floorplan/upload`
3. The form will be pre-populated with the current floorplan data
4. Make your changes and click "Save"

### Floorplan Requirements

- **Image Format**: PNG, JPG, or other common image formats
- **File Size**: Keep images under 10MB for optimal performance

## Using the Heatmap

### For Users

1. **View the heatmap**: Visit the main page to see the interactive temperature heatmap
2. **Vote on temperature comfort**: Click anywhere on the floorplan to vote on temperature comfort
   - Green areas indicate comfortable temperature zones
   - Red areas indicate areas that are too hot
   - Blue areas indicate areas that are too cold
   - Intensity shows the strength of temperature complaints
3. **Real-time updates**: The heatmap updates automatically as others vote

### Heatmap Features

- **Temperature-based voting**: Vote whether an area is too hot, too cold, or comfortable
- **Time-based decay**: Votes decay over time (30-minute half-life by default)
- **Recent activity**: Only shows votes from the last 24 hours
- **Responsive design**: Works on desktop and mobile devices

## Development

### Running Tests

```bash
bin/rails test
```

### Code Quality

```bash
# Run RuboCop for code style
bin/rubocop

# Run Brakeman for security analysis
bin/brakeman
```

### Database Management

```bash
# Reset database
bin/rails db:reset

# Run migrations
bin/rails db:migrate

# Seed data
bin/rails db:seed
```

### Asset Compilation

```bash
# Build JavaScript assets
yarn build

# Build CSS assets
yarn build:css

# Watch for changes (development)
yarn build --watch
```



## Architecture

### Key Components

- **Models**: `Floorplan`, `Vote`, `Admin`
- **Controllers**: `FloorplansController`, `VotesController`
- **Channels**: `VotesChannel` for real-time updates
- **JavaScript**: Stimulus controllers for interactive features
- **Styling**: Tailwind CSS for responsive design

### Database Schema

- **floorplans**: Stores floorplan metadata and image attachments
- **votes**: Stores temperature comfort votes with coordinates and timestamps
- **admins**: Stores admin user accounts (Devise)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
