# Attack Board Rules

### Map as structured JSON

```json
{
  "QL1": ["QL2", "KL1", "KL2"],
  "QL2": ["QL1", "QL3", "KL1", "KL2", "KL3"],
  "QL3": ["QL2", "QL4", "KL2", "KL3", "KL4"],
  "QL4": ["QL3", "QL5", "KL3", "KL4", "KL5"],
  "QL5": ["QL4", "QL6", "KL4", "KL5", "KL6"],
  "QL6": ["QL5", "KL5", "KL6"],
  "KL1": ["KL2", "QL1", "QL2"],
  "KL2": ["KL1", "KL3", "QL1", "QL2", "QL3"],
  "KL3": ["KL2", "KL4", "QL2", "QL3", "QL4"],
  "KL4": ["KL3", "KL5", "QL3", "QL4", "QL5"],
  "KL5": ["KL4", "KL6", "QL4", "QL5", "QL6"],
  "KL6": ["KL5", "QL5", "QL6"]
}
```
