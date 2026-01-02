
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
    id: 'gcp',
    name: 'Data platform on GCP',
    icon: '☁️',
    code: `graph LR
    subgraph Sources [Data Sources]
        direction TB
        IoT(IoT Devices)
        OnPremDB(On-prem Databases)
        SaaSApps(SaaS Applications)
        SystemLogs(System Logs)
    end

    subgraph Ingestion [Ingestion Layer]
        direction TB
        PubSub(Pub/Sub<br/>Streaming Ingestion)
        Datastream(Datastream<br/>Change Data Capture)
        TransferService(Storage/BigQuery<br/>Transfer Service)
    end

    subgraph DataLake [Storage & Processing Layer - Data Lake]
        direction TB
        GCS_Raw[(Cloud Storage<br/>Raw Data Zone)]
        GCS_Processed[(Cloud Storage<br/>Processed Data Zone)]
        
        subgraph Processing [Data Processing]
            Dataflow(Dataflow<br/>Batch & Stream Processing)
            Dataproc(Dataproc<br/>Spark & Hadoop)
            DataFusion(Cloud Data Fusion<br/>Visual Data Integration)
        end
    end

    subgraph DataWarehouse [Analytics & Serving Layer - Data Warehouse]
        direction TB
        BigQuery[(BigQuery<br/>Enterprise Data Warehouse)]
        
        subgraph Analytics_ML [Analytics & AI/ML]
            Looker(Looker / Looker Studio<br/>BI & Visualization)
            VertexAI(Vertex AI<br/>End-to-end ML Platform)
            BigQueryML(BigQuery ML<br/>In-database ML)
        end
    end

    subgraph CrossCutting [Cross-Cutting Services]
        direction TB
        Composer(Cloud Composer<br/>Workflow Orchestration)
        Dataplex(Dataplex & Data Catalog<br/>Data Governance & Discovery)
        IAM(Cloud IAM<br/>Identity & Access Management)
    end

    %% Data Flow - Streaming
    IoT --> PubSub
    SystemLogs --> PubSub
    PubSub --> Dataflow
    
    %% Data Flow - Batch/CDC
    OnPremDB --> Datastream
    SaaSApps --> TransferService
    Datastream --> GCS_Raw
    TransferService --> GCS_Raw
    TransferService --> BigQuery

    %% Data Processing Flow
    GCS_Raw --> Dataflow
    GCS_Raw --> Dataproc
    GCS_Raw --> DataFusion
    
    Dataflow --> GCS_Processed
    Dataproc --> GCS_Processed
    DataFusion --> GCS_Processed

    Dataflow --> BigQuery
    Dataproc --> BigQuery
    DataFusion --> BigQuery
    GCS_Processed --> BigQuery

    %% Analytics & ML Flow
    BigQuery --> Looker
    BigQuery --> VertexAI
    BigQuery --> BigQueryML

    %% Orchestration & Governance Connections (Dashed indicating control/metadata flow)
    Composer -.->|Orchestrates| Ingestion
    Composer -.->|Orchestrates| Processing
    Composer -.->|Orchestrates| BigQuery
    
    Dataplex -...->|Governs & Catalogs| GCS_Raw
    Dataplex -...->|Governs & Catalogs| GCS_Processed
    Dataplex -...->|Governs & Catalogs| BigQuery

    IAM -...->|Secures| Ingestion
    IAM -...->|Secures| DataLake
    IAM -...->|Secures| DataWarehouse
    
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
  }
];
