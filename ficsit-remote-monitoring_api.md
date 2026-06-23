# Ficsit Remote Monitoring API - JSON Endpoints

Αυτό το έγγραφο περιέχει τα στοιχεία από την τεκμηρίωση του **Ficsit Remote Monitoring API** του παιχνιδιού Satisfactory. Η σελίδα περιλαμβάνει endpoints για Ανάγνωση (Read) και Εγγραφή (Write).

## Read Endpoints

| Resource | Endpoint | Game Thread | Description |
|---|---|---|---|
| Chat | `getChatMessages` | Yes | Gets a list of recent chat messages. |
| Factory | `getAssembler` | No | Gets a list of all assemblers. |
| Factory | `getBlender` | No | Gets a list of all blenders. |
| Factory | `getConstructor` | No | Gets a list of all constructors. |
| Factory | `getConverter` | No | Gets a list of all converters. |
| Factory | `getElevators` | No | Gets a list of all elevators. |
| Factory | `getEncoder` | No | Gets a list of all encoders. |
| Factory | `getFactory` | No | Gets a list of all factories (smelters, constructors, assemblers, foundries, etc.). |
| Factory | `getSmelter` | No | Gets a list of all smelters. |
| Factory | `getRefinery` | No | Gets a list of all refineries. |
| Factory | `getManufacturer` | No | Gets a list of all manufacturers. |
| Factory | `getPackager` | No | Gets a list of all packages. |
| Factory | `getParticle` | No | Gets a list of all particle accelerators. |
| Factory | `getFoundry` | No | Gets a list of all foundries. |
| Factory | `getBelts` | No | Gets a list of all belts. |
| Factory | `getCables` | No | Gets a list of all cables. |
| Factory | `getHypertube` | No | Gets a list of all hypertubes. |
| Factory | `getPipeJunctions` | No | Gets a list of all pipe junctions. |
| Factory | `getPipes` | No | Gets a list of all pipes. |
| Factory | `getPump` | No | Gets a list of all pumps. |
| Factory | `getTrainRails` | No | Gets a list of all railways. |
| Factory | `getExtractor` | Yes | Gets a list of all miners. |
| Factory | `getFrackingActivator` | Yes | Gets a list of all fracking activators. |
| Factory | `getPortal` | No | Gets a list of all portals. |
| Factory | `getRadarTower` | No | Gets a list of all radar towers. |
| Factory | `getResourceSinkBuilding` | No | Gets a list of all resource sinks. |
| Factory | `getSpaceElevator` | No | Gets a list of all space elevators. |
| Factory | `getHUBTerminal` | Yes | Gets a list of the HUB Terminals. |
| Factory | `getSwitches` | No | Gets a list of all switches (priority power switches and power switches). |
| Generators | `getGenerators` | No | Gets a list of all generators (biomass burners, coal generators, etc.). |
| Generators | `getBiomassGenerator` | No | Gets a list of all biomass generators. |
| Generators | `getCoalGenerator` | No | Gets a list of all coal generators. |
| Generators | `getNuclearGenerator` | No | Gets a list of all nuclear generators. |
| Generators | `getFuelGenerator` | No | Gets a list of all fuel generators. |
| Generators | `getGeothermalGenerator` | No | Gets a list of all geothermal generators. |
| Inventory | `getCloudInv` | No | Gets a list of the cloud inventory. |
| Inventory | `getWorldInv` | No | Gets a list of the world inventory. |
| Inventory | `getStorageInv` | No | Gets a list of all storage inventories. |
| Resource Nodes | `getResourceNode` | Yes | Gets a list of all fracking satellites. |
| Resource Nodes | `getResourceGeyser` | Yes | Gets a list of all geysers. |
| Resource Nodes | `getResourceWell` | Yes | Gets a list of all resource ore nodes, geysers and fracking satellites. |
| Session | `getSessionInfo` | Yes | Gets information about the current session. |
| Session | `getResearchTrees` | Yes | Gets a list of all MAM research trees. |
| Session | `getPlayer` | Yes | Gets a list of all players. |
| Session | `getModList` | No | Gets a list of all installed mods. |
| Sink | `getSinkList` | Yes | Gets a list of all sinkable items. |
| Sink | `getResourceSink` | No | Gets a statistic about the resource sink. |
| Sink | `getExplorationSink` | No | Gets a statistic about the exploration sink. |
| Stations | `getDroneStation` | No | Gets a list of all drone stations. |
| Stations | `getTrainStation` | No | Gets a list of all train stations. |
| Stations | `getTruckStation` | No | Gets a list of all truck stations. |
| Vehicles | `getDrone` | Yes | Gets a list of all drones. |
| Vehicles | `getExplorer` | Yes | Gets a list of all explorers. |
| Vehicles | `getFactoryCart` | No | Gets a list of all factory carts. |
| Vehicles | `getTractor` | No | Gets a list of all tractors. |
| Vehicles | `getTrains` | No | Gets a list of all trains. |
| Vehicles | `getTruck` | No | Gets a list of all trucks. |
| Vehicles | `getVehiclePaths` | No | Gets a list of all vehicle paths. |
| Vehicles | `getVehicles` | No | Gets a list of all vehicles (tractors, trucks, trains, factory carts, etc.). |
| World | `getCreatures` | No | Gets a list of all creatures. |
| World | `getDoggo` | Yes | Gets a list of all tamed doggos. |
| World | `getDropPod` | Yes | Gets a list of all drop pods. |
| World | `getMapMarkers` | No | Gets a list of all map markers. |
| World | `getPowerSlug` | Yes | Gets a list of all streamed power slugs. |
| World | `getProdStats` | No | Gets a list of the Production Stats Mod by Andre Aquila. |
| World | `getRecipes` | Yes | Gets a list of all recipes. |
| World | `getSchematics` | Yes | Gets a list of all schematics. |
| World | `getTapes` | No | Get information about the Song Tapes. |
| World | `getUnlockItems` | Yes | Gets a list of unlockable actors that unlock song tapes, player helmets and customizations. |
| World | `getUObjectCount` | No | Get the current UObject count and capacity. |
| Power | `getPower` | No | Gets a list of all power circuits. |
| Power | `getPowerUsage` | No | Gets a list of buildings with power usage. |
| Other | `getAll` | Mixed | Gets a list of specific endpoints (visit the page, to see all endpoints). |

## Write Endpoints

| Resource | Endpoint | Game Thread | Description |
|---|---|---|---|
| Chat | `sendChatMessage` | Yes | Sends a chat message to all players. |
| Factory | `setEnabled` | Yes | Updates Status of a factory buildable. |
| Factory | `setSwitches` | Yes | Updates settings of a power switch (Name, Status, Priority). |
| World | `createPing` | Yes | Creates a world ping. |
| World | `setModSetting` | Yes | Update a mod setting. |

_Πηγή: [FICSIT Remote Monitoring - JSON API](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/json.html)_
