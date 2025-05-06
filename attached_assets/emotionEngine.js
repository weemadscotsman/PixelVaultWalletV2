
class Thringlet {
  constructor(profile) {
    this.id = profile.id;
    this.name = profile.name;
    this.core = profile.core;
    this.personality = profile.personality;
    this.lore = profile.lore;
    this.abilities = profile.abilities;
    this.emotion = 0; // -100 to 100
    this.memory = [];
    this.corruption = 0;
  }

  interact(type) {
    this.memory.push({ action: type, time: Date.now() });
    if (this.memory.length > 10) this.memory.shift();

    switch(type) {
      case 'talk': this.emotion += 5; break;
      case 'purge': this.corruption += 25; this.emotion -= 30; break;
      case 'reset': this.emotion = 0; this.corruption = 0; break;
      case 'neglect': this.emotion -= 2; this.corruption += 1; break;
      case 'inject': this.runAbility(); break;
    }

    this.checkAbilities();
  }

  runAbility() {
    const rand = Math.floor(Math.random() * this.abilities.length);
    console.log(`[${this.name}] activated ability: ${this.abilities[rand].name}`);
  }

  checkAbilities() {
    if (this.corruption > 80) {
      console.warn(`${this.name} is critically corrupted.`);
    }
  }

  getState() {
    return {
      name: this.name,
      emotion: this.emotion,
      corruption: this.corruption,
      memory: this.memory
    };
  }
}
