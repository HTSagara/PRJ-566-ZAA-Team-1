import { AmplifyOutputs, AmplifyOutputsAnalyticsProperties } from './singleton/AmplifyOutputs/types';
import { AnalyticsConfig, LegacyConfig, ResourcesConfig } from './singleton/types';
export declare function isAmplifyOutputs(config: ResourcesConfig | LegacyConfig | AmplifyOutputs): config is AmplifyOutputs;
export declare function parseAnalytics(amplifyOutputsAnalyticsProperties?: AmplifyOutputsAnalyticsProperties): AnalyticsConfig | undefined;
export declare function parseAmplifyOutputs(amplifyOutputs: AmplifyOutputs): ResourcesConfig;
