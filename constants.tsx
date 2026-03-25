
import { DiagramTemplate } from './types';

export const DEFAULT_DIAGRAM = `graph TD
    A["Christmas"] -->|"Get money"| B["Go shopping"]
    B --> C{"Let me think"}
    C -->|"One"| D["Laptop"]
    C -->|"Two"| E["iPhone"]
    C -->|"Three"| F["Car"]`;

export const TEMPLATES: DiagramTemplate[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    icon: '📊',
    code: `graph TD
    Start["Start"] --> Process["Process"]
    Process --> Decision{"Is it working?"}
    Decision -->|"Yes"| Success["Success"]
    Decision -->|"No"| Fix["Fix the issue"]
    Fix --> Process`
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    icon: '🔄',
    code: `sequenceDiagram
    Alice->>John: "Hello John, how are you?"
    John-->>Alice: "Great!"
    Alice->>John: "See you later!"`
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    icon: '📅',
    code: `gantt
    title "A Gantt Diagram"
    section "Section"
    "A task"           :a1, 2023-01-01, 30d
    "Another task"     :after a1  , 20d`
  },
  {
    id: 'class',
    name: 'Class Diagram',
    icon: '🏛️',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : "+int age"
    Animal : "+String gender"
    Animal: "+isMammal()"
    Animal: "+mate()"`
  },
  {
    id: 'er',
    name: 'ER Diagram',
    icon: '🔗',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--|{ LINE-ITEM : "contains"
    CUSTOMER }|..|{ DELIVERY-ADDRESS : "uses"`
  },
  {
    id: 'layered',
    name: 'Layered Architecture',
    icon: '🏗️',
    code: `flowchart LR
    %% Node Definitions with Structured Shapes
    subgraph Clients ["fa:fa-users CLIENT APPLICATIONS"]
        direction TB
        Dev(["fa:fa-laptop Dev Teams"])
        Agents(["fa:fa-robot AI Agents"])
    end

    %% Entry Point
    GatewayEntry[["fa:fa-door-open API Gateway"]]

    %% Main Cloud Region
    subgraph Region ["fa:fa-cloud CLOUD REGION"]
        direction LR
        
        subgraph Gateway ["fa:fa-network-wired UNIFIED SERVICE GATEWAY"]
            direction LR
            
            subgraph Security ["fa:fa-shield-halved SECURITY LAYER"]
                direction TB
                WAF[["fa:fa-filter WAF / Filtering"]]
                Auth[["fa:fa-lock Auth Service"]]
            end

            subgraph Governance ["fa:fa-gavel GOVERNANCE LAYER"]
                direction TB
                Policy[["fa:fa-clipboard-check Policy Enforcement"]]
                Routing{{"fa:fa-route Routing Controls"}}
            end

            subgraph Billing ["fa:fa-file-invoice-dollar BILLING / MONITORING"]
                direction TB
                TCO[["fa:fa-chart-line Quota Management"]]
                DB[("fa:fa-database Logs/Stats DB")]
            end

            %% Internal Flows
            WAF --> Auth
            Auth --> Routing
            Routing --> Policy
            Policy --> TCO
            TCO -.-> DB
        end
    end

    %% Provider Section
    subgraph Providers ["fa:fa-server SERVICE PROVIDERS"]
        direction TB
        P1[["fa:fa-cloud-meatball Provider A"]]
        P2[["fa:fa-cloud-meatball Provider B"]]
        P3[["fa:fa-cloud-meatball Provider C"]]
    end

    %% Main Connections
    Clients ==>|"fa:fa-arrow-right API Requests"| GatewayEntry
    GatewayEntry ==> WAF
    
    Routing ==>|"fa:fa-shield-check Secure API"| P1
    Routing ==>|"fa:fa-link External API"| P2
    Routing ==>|"fa:fa-link External API"| P3

    %% Styling & Alignment Classes
    classDef default font-family:Inter,font-size:13px;
    
    classDef client fill:#f0f9ff,stroke:#0ea5e9,stroke-width:2px;
    classDef gateway fill:#f8fafc,stroke:#64748b,stroke-width:2px;
    classDef security fill:#f0fdf4,stroke:#22c55e,stroke-width:2px;
    classDef governance fill:#fffbeb,stroke:#f59e0b,stroke-width:2px;
    classDef billing fill:#fef2f2,stroke:#ef4444,stroke-width:2px;
    classDef provider fill:#faf5ff,stroke:#a855f7,stroke-width:2px;

    class Dev,Agents client;
    class GatewayEntry gateway;
    class WAF,Auth security;
    class Policy,Routing governance;
    class TCO,DB billing;
    class P1,P2,P3 provider;`
  },
  {
    id: 'gcp',
    name: 'Data platform on GCP',
    icon: '☁️',
    code: `flowchart LR
    subgraph Sources ["fa:fa-database Data Sources"]
        direction TB
        IoT(["fa:fa-microchip IoT Devices"])
        OnPremDB[("fa:fa-server On-prem Databases")]
        SaaSApps(["fa:fa-cloud SaaS Applications"])
        SystemLogs(["fa:fa-file-lines System Logs"])
    end

    subgraph Ingestion ["fa:fa-arrow-right-to-bracket Ingestion Layer"]
        direction TB
        PubSub[["fa:fa-envelope Pub/Sub"]]
        Datastream[["fa:fa-stream Datastream"]]
        TransferService[["fa:fa-truck-loading Transfer Service"]]
    end

    subgraph DataLake ["fa:fa-bucket Storage & Processing"]
        direction TB
        GCS_Raw[("fa:fa-box GCS Raw Zone")]
        GCS_Processed[("fa:fa-box-open GCS Processed Zone")]
        
        subgraph Processing ["fa:fa-gear Data Processing"]
            direction TB
            Dataflow[["fa:fa-infinity Dataflow"]]
            Dataproc[["fa:fa-cluster Dataproc"]]
            DataFusion[["fa:fa-wand-magic-sparkles Data Fusion"]]
        end
    end

    subgraph DataWarehouse ["fa:fa-warehouse Analytics & Serving"]
        direction TB
        BigQuery[("fa:fa-magnifying-glass-chart BigQuery")]
        
        subgraph Analytics_ML ["fa:fa-brain Analytics & AI/ML"]
            direction TB
            Looker(["fa:fa-chart-pie Looker"])
            VertexAI(["fa:fa-sparkles Vertex AI"])
            BigQueryML(["fa:fa-robot BigQuery ML"])
        end
    end

    subgraph CrossCutting ["fa:fa-gears Cross-Cutting Services"]
        direction TB
        Composer[["fa:fa-calendar-check Composer"]]
        Dataplex[["fa:fa-shield-check Dataplex"]]
        IAM[["fa:fa-user-lock IAM"]]
    end

    %% Data Flow
    Sources ==> Ingestion
    Ingestion ==> GCS_Raw
    GCS_Raw ==> Processing
    Processing ==> GCS_Processed
    GCS_Processed ==> BigQuery
    BigQuery ==> Analytics_ML

    %% Orchestration
    Composer -.->|Orchestrates| Ingestion
    Composer -.->|Orchestrates| Processing
    Composer -.->|Orchestrates| BigQuery
    
    Dataplex -...->|Governs| GCS_Raw
    Dataplex -...->|Governs| BigQuery

    %% Styling
    classDef source fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef ingestion fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef processing fill:#ede7f6,stroke:#673ab7,stroke-width:2px;
    classDef warehouse fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef analytics fill:#fbe9e7,stroke:#bf360c,stroke-width:2px;
    classDef crosscutting fill:#eceff1,stroke:#455a64,stroke-width:2px,stroke-dasharray: 5 5;

    class IoT,OnPremDB,SaaSApps,SystemLogs source;
    class PubSub,Datastream,TransferService ingestion;
    class GCS_Raw,GCS_Processed storage;
    class Dataflow,Dataproc,DataFusion processing;
    class BigQuery warehouse;
    class Looker,VertexAI,BigQueryML analytics;
    class Composer,Dataplex,IAM crosscutting;`
  },
  {
    id: 'mindmap',
    name: 'Mindmap',
    icon: '🧠',
    code: `mindmap
  root((MermaidAI))
    Features
      AI Generation
      Real-time Preview
      Auto-fix
    Export
      SVG
      PNG
      Markdown
    Templates
      Flowchart
      Sequence
      Gantt`
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: '⏳',
    code: `timeline
    title History of Social Media
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : Youtube
    2006 : Twitter`
  }
];
