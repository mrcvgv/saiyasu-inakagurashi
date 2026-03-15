/**
 * Source loader — requires all source strategy modules so they
 * self-register with the source_registry on import.
 *
 * To onboard a new source:
 *   1. Create src/sources/<source_name>.js with listing/detail strategies
 *   2. Add a require() line below
 *   3. Add the source to config/sources.json
 */

require('./generic');
require('./ieichiba');
require('./yamakita');
require('./hanno');
require('./saku');
require('./kamogawa');
require('./chichibu');
require('./minamiboso');
require('./sakuho');
require('./zero_estate');
require('./saihoku');
require('./tokigawa');
