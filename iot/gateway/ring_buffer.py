class RingBuffer:
    def __init__(self, capacity):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self._capacity = capacity
        self._items = []

    def append(self, item):
        self._items.append(item)
        if len(self._items) > self._capacity:
            self._items.pop(0)

    def drain(self):
        items = self._items
        self._items = []
        return items

    def __len__(self):
        return len(self._items)

    @property
    def capacity(self):
        return self._capacity
