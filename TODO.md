# TODO & Feature Roadmap

## High Priority (Core Functionality)

### Firebase Integration
- [ ] **Replace in-memory storage with Firestore**
  - Migrate portfolio data to Firestore collections
  - Implement real-time listeners for portfolio updates
  - Add proper data models and validation

- [ ] **Replace in-memory leaderboard with Firestore**
  - Store leaderboard entries in Firestore
  - Implement efficient queries with indexes
  - Add real-time leaderboard updates

- [ ] **Backend Firebase Admin SDK**
  - Set up Firebase Admin SDK for backend
  - Verify Firebase tokens on protected routes
  - Implement user authentication middleware

### Security & Authentication
- [ ] **Authentication Middleware**
  - Create middleware to verify Firebase ID tokens
  - Protect all portfolio and user-specific routes
  - Add role-based access control (if needed)

- [ ] **Input Validation**
  - Add validation schemas (Joi, Yup, or Zod)
  - Validate all user inputs on backend
  - Sanitize inputs to prevent injection attacks

- [ ] **Rate Limiting**
  - Implement per-user rate limiting (not just IP-based)
  - Add rate limiting for portfolio operations
  - Track and log rate limit violations

### Data Persistence
- [ ] **Transaction History**
  - Store all buy/sell transactions in Firestore
  - Add transaction history page in frontend
  - Implement transaction filtering and search

- [ ] **Portfolio Snapshot History**
  - Store daily portfolio snapshots
  - Enable portfolio value over time charts
  - Calculate historical performance metrics

## Medium Priority (Enhanced Features)

### Trading Features
- [ ] **Order Types**
  - Limit orders (buy/sell at specific price)
  - Stop-loss orders
  - Take-profit orders
  - Order expiration and cancellation

- [ ] **Paper Trading Rules**
  - Implement realistic trading hours (stock market hours)
  - Add minimum order sizes
  - Enforce settlement periods
  - Add margin trading (optional)

- [ ] **Portfolio Analytics**
  - Asset allocation pie chart
  - Performance over time (line chart)
  - Win/loss ratio
  - Best/worst performing assets
  - Total return percentage

### User Experience
- [ ] **Watchlists**
  - Create multiple watchlists
  - Add/remove assets to watchlists
  - Quick access from dashboard
  - Price alerts for watchlist items

- [ ] **Search & Discovery**
  - Improved search with autocomplete
  - Trending assets section
  - Recommended assets based on portfolio
  - Asset details page with news/analysis

- [ ] **Notifications**
  - Push notifications for price alerts
  - Email notifications for portfolio milestones
  - In-app notification center
  - Browser push notifications

### Charts & Visualization
- [ ] **Advanced Technical Indicators**
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Volume analysis

- [ ] **Chart Enhancements**
  - Multiple chart layouts (split view)
  - Drawing tools (trend lines, annotations)
  - Chart templates and presets
  - Export charts as images

## Low Priority (Future Enhancements)

### Advanced Features
- [ ] **Backtesting**
  - Historical strategy testing
  - Performance metrics (Sharpe ratio, max drawdown)
  - Strategy comparison tools
  - Export backtest results

- [ ] **Social Features**
  - Share portfolios publicly/privately
  - Follow other traders
  - Comments and discussions
  - Copy trading (optional)

- [ ] **Mobile App**
  - React Native mobile app
  - Push notifications
  - Biometric authentication
  - Offline mode

### Data & Analytics
- [ ] **Multi-currency Support**
  - Track portfolios in different currencies
  - Currency conversion
  - Multi-currency leaderboards

- [ ] **Export & Reporting**
  - Export portfolio to CSV/PDF
  - Generate tax reports
  - Transaction history export
  - Performance reports

- [ ] **Data Integration**
  - News feed integration
  - Social sentiment analysis
  - Economic calendar
  - Earnings calendar

### Infrastructure
- [ ] **Performance Optimization**
  - Redis for distributed caching
  - Database connection pooling
  - Code splitting and lazy loading
  - CDN for static assets

- [ ] **Monitoring & Logging**
  - Error tracking (Sentry)
  - Application performance monitoring
  - API usage analytics
  - User behavior tracking

- [ ] **Testing**
  - Increase test coverage (>80%)
  - E2E tests (Cypress/Playwright)
  - Load testing
  - Security testing

## Technical Debt

- [ ] **Code Organization**
  - Refactor large components into smaller ones
  - Extract reusable hooks
  - Improve error handling patterns
  - Add TypeScript (optional but recommended)

- [ ] **Documentation**
  - API documentation (Swagger/OpenAPI)
  - Component documentation (Storybook)
  - Architecture decision records
  - Deployment guides

- [ ] **CI/CD**
  - GitHub Actions workflows
  - Automated testing on PR
  - Automated deployments
  - Environment management

## Notes

- Prioritize based on user feedback and business needs
- Some features may require additional third-party services
- Consider API costs when implementing new features
- Keep security and performance in mind for all features

