export type FeatureCategory =
  | 'Infrastructure'
  | 'Database'
  | 'Security'
  | 'Observability'
  | 'API'
  | 'Messaging'
  | 'DevOps'
  | 'Testing'
  | 'Architecture';

export interface FeatureQuestion {
  id: string;
  question: string;
  type: 'boolean' | 'select' | 'text';
  options?: string[];
  defaultValue: any;
  impactDescription: string;
}

export interface GeneratedFile {
  path: string;
  language: string;
  templateSnippet: string;
  description: string;
}

export interface GeneratedPackage {
  name: string;
  version: string;
  packageManager: 'nuget' | 'npm' | 'maven' | 'pip' | 'cargo' | 'go';
}

export interface FeatureManifest {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  tags: string[];
  dependencies: string[]; // Required feature IDs
  optionalDependencies: string[];
  recommendedDependencies: string[];
  conflictingFeatures: string[];
  questions: FeatureQuestion[];
  configuration: Record<string, any>;
  generatedFiles: GeneratedFile[];
  generatedPackages: GeneratedPackage[];
  generatedProjects: string[];
  documentation: string;
  aiRecommendations: string[];
  securityWarnings: string[];
  architectureImpact: string;
  performanceImpact: string;
  maintainabilityImpact: string;
  bestPractices: string[];
  isActive?: boolean;
  autoActivatedReason?: string;
  impactScores: {
    security: number;
    architecture: number;
    performance: number;
    scalability: number;
    maintainability: number;
    complexity: number;
  };
}

export type ArchitectureStyle =
  | 'CleanArchitecture'
  | 'Microservices'
  | 'ModularMonolith'
  | 'Hexagonal'
  | 'CQRS'
  | 'EventDriven';

export interface TechStack {
  id: string;
  name: string;
  language: 'csharp' | 'typescript' | 'java' | 'go' | 'python' | 'rust' | 'kotlin' | 'dart';
  framework: string;
  packageManager: string;
  testingFramework: string;
  targetRuntime: string;
  description: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'dependency' | 'naming' | 'security' | 'code-standard' | 'performance';
  severity: 'error' | 'warning' | 'info';
  expression: string;
  isEnabled: boolean;
  remediation: string;
}

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
}

export interface BlueprintProject {
  id: string;
  name: string;
  type: 'Core' | 'Application' | 'Infrastructure' | 'API' | 'Worker' | 'Tests' | 'UI';
  references: string[]; // Project IDs referenced by this project
  description: string;
  packages?: Array<{ name: string; version: string; packageManager?: string }>;
}

export interface ProfileSecurity {
  id: string;
  name: string;
  jwtIssuer: string;
  tokenLifetimeMinutes: number;
  enableCors: boolean;
  allowedOrigins: string[];
  enableRateLimiting: boolean;
  rateLimitPermitLimit: number;
}

export interface ProfileDatabase {
  id: string;
  name: string;
  provider: 'PostgreSQL' | 'SQL Server' | 'MongoDB' | 'SQLite' | 'MySQL';
  orm: 'Entity Framework Core' | 'Prisma' | 'Dapper' | 'Hibernate' | 'GORM';
  enableMigrations: boolean;
  enableAuditing: boolean;
  connectionStringName: string;
}

export interface ProfileDocker {
  id: string;
  name: string;
  baseImage: string;
  multiStage: boolean;
  exposePorts: number[];
  includeDockerCompose: boolean;
  healthCheckEndpoint: string;
}

export interface ProfileCache {
  id: string;
  name: string;
  provider: 'Redis' | 'In-Memory' | 'Memcached';
  defaultTtlMinutes: number;
  enableDistributedLock: boolean;
}

export interface ProfileLogging {
  id: string;
  name: string;
  provider: 'Serilog' | 'OpenTelemetry' | 'Winston' | 'Zap';
  minLevel: 'Information' | 'Debug' | 'Warning' | 'Error';
  structuredJson: boolean;
  sinkToConsole: boolean;
  sinkToSeqOrJaeger: boolean;
}

export interface BlueprintProfiles {
  securityProfileId: string;
  databaseProfileId: string;
  dockerProfileId: string;
  cacheProfileId: string;
  loggingProfileId: string;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  architectureStyle: ArchitectureStyle;
  techStackId: string;
  projects: BlueprintProject[];
  featureIds: string[];
  disabledAutoFeatures: string[]; // User explicitly disabled features that were recommended
  ruleSetId: string;
  profiles: BlueprintProfiles;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  blueprint: Blueprint;
  version: string;
  author: string;
  updatedAt: string;
  tags: string[];
  isOfficial: boolean;
  downloadCount: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  organizationId: string;
  workspaceId: string;
  templateId: string;
  blueprint: Blueprint;
  status: 'draft' | 'configuring' | 'generated' | 'deployed';
  createdAt: string;
  updatedAt: string;
  customConfig: Record<string, any>;
}

export interface DecisionLogItem {
  id: string;
  projectId: string;
  decision: string;
  date: string;
  reason: string;
  impact: string;
  warningsIgnored: string[];
  aiRecommendations: string[];
  userJustification: string;
  author: string;
}

export interface ScoreRationale {
  category: string;
  score: number;
  reason: string;
  recommendations: string[];
}

export interface AdvisorScores {
  securityScore: number;
  architectureScore: number;
  performanceScore: number;
  scalabilityScore: number;
  maintainabilityScore: number;
  complexityScore: number;
  qualityScore: number;
  rationale: ScoreRationale[];
}

export interface ValidationMessage {
  id: string;
  type: 'error' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
  affectedComponent: string;
  autoFixAvailable: boolean;
  ruleId?: string;
  consequenceIfIgnored?: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  model: string;
  provider: 'Google Gemini' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Azure OpenAI' | 'Ollama';
  status: 'active' | 'configured' | 'offline';
  costPer1k: string;
  latency: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  role: 'System' | 'Developer' | 'User';
  category: string;
  prompt: string;
  variables: string[];
  version: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  plan: 'Enterprise' | 'Team' | 'Developer';
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description: string;
}

export interface AffectedComponentImpact {
  type: 'ConnectionString' | 'Package' | 'Docker' | 'HealthCheck' | 'ORMProvider' | 'MigrationProject' | 'Documentation' | 'CodeFile';
  name: string;
  action: 'Added' | 'Modified' | 'Removed' | 'Replaced';
  detail: string;
}
