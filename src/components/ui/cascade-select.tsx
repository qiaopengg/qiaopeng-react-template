"use client";

import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CascadeOption {
  code: string;
  name: string;
}

interface CascadeSelectProps {
  provinces: CascadeOption[];
  cities: Record<string, CascadeOption[]>;
  districts: Record<string, CascadeOption[]>;
  value?: {
    province?: string;
    city?: string;
    district?: string;
  };
  onChange?: (value: { province: string; city: string; district: string }) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function CascadeSelect({
  provinces,
  cities,
  districts,
  value,
  onChange,
  placeholder = "请选择地区",
  className,
  error
}: CascadeSelectProps) {
  const [open, setOpen] = React.useState(false);

  // 最终确定的值
  const [finalValue, setFinalValue] = React.useState({
    province: value?.province || "",
    city: value?.city || "",
    district: value?.district || ""
  });

  // 临时用于菜单交互的值
  const [tempProvince, setTempProvince] = React.useState(finalValue.province);
  const [tempCity, setTempCity] = React.useState(finalValue.city);

  // 当菜单打开时，用最终值同步临时值
  React.useEffect(() => {
    if (open) {
      setTempProvince(finalValue.province);
      setTempCity(finalValue.city);
    }
  }, [open, finalValue]);

  // 处理省份选择（悬停时）
  const handleProvinceHover = (provinceCode: string) => {
    setTempProvince(provinceCode);
    setTempCity(""); // 重置城市选择
  };

  // 处理城市选择（悬停时）
  const handleCityHover = (cityCode: string) => {
    setTempCity(cityCode);
  };

  // 处理区县选择（点击时）
  const handleDistrictSelect = (districtCode: string) => {
    const newValue = {
      province: tempProvince,
      city: tempCity,
      district: districtCode
    };
    setFinalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
    setOpen(false); // 完成选择，关闭菜单
  };

  // 根据编码查找名称
  const getNames = (v: typeof finalValue) => ({
    provinceName: provinces.find((p) => p.code === v.province)?.name,
    cityName: v.province ? cities[v.province]?.find((c) => c.code === v.city)?.name : undefined,
    districtName: v.city ? districts[v.city]?.find((d) => d.code === v.district)?.name : undefined
  });

  const { provinceName, cityName, districtName } = getNames(finalValue);
  const displayText = [provinceName, cityName, districtName].filter(Boolean).join(" / ") || placeholder;

  const tempCities = cities[tempProvince] || [];
  const tempDistricts = districts[tempCity] || [];

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between" aria-invalid={error}>
            <span
              className={cn("font-normal", displayText !== placeholder ? "text-foreground" : "text-muted-foreground")}
            >
              {displayText}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {provinces.map((province) => (
            <DropdownMenuSub key={province.code}>
              <DropdownMenuSubTrigger onPointerEnter={() => handleProvinceHover(province.code)}>
                {province.name}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {tempCities.length > 0 ? (
                  tempCities.map((city) => (
                    <DropdownMenuSub key={city.code}>
                      <DropdownMenuSubTrigger onPointerEnter={() => handleCityHover(city.code)}>
                        {city.name}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {tempDistricts.length > 0 ? (
                          tempDistricts.map((district) => (
                            <DropdownMenuItem key={district.code} onSelect={() => handleDistrictSelect(district.code)}>
                              {district.name}
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled>暂无区县</DropdownMenuItem>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))
                ) : (
                  <DropdownMenuItem disabled>暂无城市</DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
