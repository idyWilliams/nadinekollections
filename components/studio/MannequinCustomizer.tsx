"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MannequinSettings {
  gender: string;
  skinTone: string;
  size: string;
  age: string;
}

interface Props {
  settings: MannequinSettings;
  onChange: (settings: MannequinSettings) => void;
}

export function MannequinCustomizer({ settings, onChange }: Props) {
  const handleChange = (key: keyof MannequinSettings, value: string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Gender */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Gender</Label>
        <RadioGroup
          value={settings.gender}
          onValueChange={(val: string) => handleChange("gender", val)}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="female" id="female" className="peer sr-only" />
            <Label
              htmlFor="female"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold peer-data-[state=checked]:text-gold cursor-pointer transition-all"
            >
              Female
            </Label>
          </div>
          <div>
            <RadioGroupItem value="male" id="male" className="peer sr-only" />
            <Label
              htmlFor="male"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold peer-data-[state=checked]:text-gold cursor-pointer transition-all"
            >
              Male
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Skin Tone */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Complexion</Label>
        <div className="grid grid-cols-5 gap-2">
          {['fair', 'light', 'medium', 'tan', 'dark'].map((tone) => (
            <button
              key={tone}
              onClick={() => handleChange("skinTone", tone)}
              className={`w-full aspect-square rounded-full border-2 transition-all ${
                settings.skinTone === tone ? 'border-gold scale-110 ring-2 ring-gold/20' : 'border-transparent hover:scale-105'
              }`}
              style={{
                backgroundColor:
                  tone === 'fair' ? '#F5E0D8' :
                  tone === 'light' ? '#EAC0A6' :
                  tone === 'medium' ? '#C68642' :
                  tone === 'tan' ? '#8D5524' : '#3B2219'
              }}
              title={tone.charAt(0).toUpperCase() + tone.slice(1)}
            />
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Body Size</Label>
        <Select value={settings.size} onValueChange={(val: string) => handleChange("size", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="petite">Petite</SelectItem>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="plus">Plus Size</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Age Group */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Age Group</Label>
        <Select value={settings.age} onValueChange={(val: string) => handleChange("age", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="teen">Teen</SelectItem>
            <SelectItem value="young-adult">Young Adult</SelectItem>
            <SelectItem value="adult">Adult</SelectItem>
            <SelectItem value="mature">Mature</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
