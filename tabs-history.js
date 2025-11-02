export class TabsHistory {
  constructor(value, currentPosition) {
    this.ids = value;
    this.currentPosition = currentPosition;
  }

  // Insert at a given index
  insert(value) {
    if (value !== this.ids[this.currentPosition]) {
      this.ids =
        [
          ...this.ids.slice(0, this.currentPosition + 1),
          value,
          ...this.ids.slice(this.currentPosition + 1)
        ];
      this.currentPosition++;
      // Limit history to 50 entries
      if (this.ids.length > 50) {
        const excess = this.ids.length - 50;
        this.ids = this.ids.slice(excess);
        this.currentPosition -= excess;
        if (this.currentPosition < 0) this.currentPosition = 0;
      }
    }
  }

  // Remove by value
  removeByValue(value) {
    let removedIndexesToTheLeft = 0
    // remove all elements that has _value_
    this.ids = this.ids.filter((val, idx) => {
      const keepCondition = val !== value;
      if (!keepCondition && idx <= this.currentPosition) {
        removedIndexesToTheLeft++;
      }
      return keepCondition;
    });
    this.currentPosition -= removedIndexesToTheLeft;
    // now remove all _consecutive duplicates_ that are created
    let removedConsecutiveDuplicatesToTheLeft = 0;
    this.ids = this.ids.filter((val, idx) => {
      const keepCondition = idx === 0 || val !== this.ids[idx - 1];
      if (!keepCondition && idx <= this.currentPosition) {
        removedConsecutiveDuplicatesToTheLeft++;
      }

      return keepCondition;
    })
    this.currentPosition -= removedConsecutiveDuplicatesToTheLeft;
  }

  goToPreviousTab() {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      return this.ids[this.currentPosition];
    }
  }

  goToNextTab() {
    if (this.currentPosition < this.ids.length - 1) {
      this.currentPosition++;
      return this.ids[this.currentPosition];
    }
  }

  serialize() {
    return JSON.stringify({ 'ids': this.ids, 'currentPosition': this.currentPosition });
  }

  static deserialize(ids, currentPosition) {
    return new TabsHistory(ids, currentPosition);
  }
}
