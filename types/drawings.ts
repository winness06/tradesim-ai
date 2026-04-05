export type DrawTool =
  | 'hline' | 'vline' | 'hray'
  | 'trendline' | 'extended_line'
  | 'parallel_channel'
  | 'rect_zone'
  | 'circle'
  | 'fib' | 'fib_extension' | 'fib_fan'
  | 'text' | 'price_label'
  | 'eraser' | 'clear';

export interface DrawPoint {
  price: number;
  /** Unix timestamp in seconds */
  time: number;
}

export type Drawing =
  | { id: string; type: 'hline'; price: number }
  | { id: string; type: 'vline'; time: number }
  | { id: string; type: 'hray'; price: number; startTime: number }
  | { id: string; type: 'trendline'; p1: DrawPoint; p2: DrawPoint; extended: boolean }
  | { id: string; type: 'rect'; p1: DrawPoint; p2: DrawPoint; zone: 'support' | 'resist' }
  | { id: string; type: 'fib'; p1: DrawPoint; p2: DrawPoint }
  | { id: string; type: 'text'; pos: DrawPoint; label: string }
  | { id: string; type: 'price_label'; pos: DrawPoint };
