
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
  }
];
