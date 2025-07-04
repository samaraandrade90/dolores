function Frame5() {
  return (
    <div className="relative shrink-0">
      <div className="box-border content-stretch flex flex-col gap-1 items-center justify-start leading-[0] not-italic p-0 relative text-center text-neutral-500 text-nowrap">
        <div className="font-['Space_Grotesk:Medium',_sans-serif] relative shrink-0 text-[20px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            10
          </p>
        </div>
        <div className="font-['Space_Grotesk:SemiBold',_sans-serif] relative shrink-0 text-[14px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            Todas
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="relative shrink-0">
      <div className="absolute border-[1px_0px_0px] border-neutral-500 border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-center pb-0 pt-2 px-0 relative">
          <div className="font-['Space_Grotesk:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[12px] text-center text-neutral-500 text-nowrap">
            <p className="block leading-[normal] whitespace-pre">R$ 100,00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="basis-0 bg-[#ffffff] grow h-full min-h-px min-w-px relative rounded-2xl shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center p-[16px] relative size-full">
          <Frame5 />
          <Frame7 />
        </div>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative shrink-0">
      <div className="box-border content-stretch flex flex-col font-['Space_Grotesk:Medium',_sans-serif] gap-1 items-center justify-start leading-[0] not-italic p-0 relative text-[#16ae65] text-center text-nowrap">
        <div className="relative shrink-0 text-[20px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">8</p>
        </div>
        <div className="relative shrink-0 text-[14px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            Concluídas
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative shrink-0">
      <div className="absolute border-[#16ae65] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start leading-[0] not-italic pb-0 pt-2 px-0 relative text-[#16ae65] text-[12px] text-center text-nowrap">
          <div className="font-['Font_Awesome_6_Pro:Regular',_sans-serif] relative shrink-0">
            <p className="block leading-[normal] text-nowrap whitespace-pre">
              check
            </p>
          </div>
          <div className="font-['Space_Grotesk:Medium',_sans-serif] relative shrink-0">
            <p className="block leading-[normal] text-nowrap whitespace-pre">
              R$ 80,00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="basis-0 bg-[#ffffff] grow h-full min-h-px min-w-px relative rounded-2xl shrink-0">
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center p-[16px] relative size-full">
          <Frame8 />
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="relative shrink-0">
      <div className="box-border content-stretch flex flex-col gap-1 items-center justify-start leading-[0] not-italic p-0 relative text-[#2497fd] text-center text-nowrap">
        <div className="font-['Space_Grotesk:Medium',_sans-serif] relative shrink-0 text-[20px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">2</p>
        </div>
        <div className="font-['Space_Grotesk:SemiBold',_sans-serif] relative shrink-0 text-[14px]">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            Pendentes
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="relative shrink-0">
      <div className="absolute border-[#2497fd] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start leading-[0] not-italic pb-0 pt-2 px-0 relative text-[#2497fd] text-[12px] text-center text-nowrap">
          <div className="font-['Font_Awesome_6_Pro:Regular',_sans-serif] relative shrink-0">
            <p className="block leading-[normal] text-nowrap whitespace-pre">
              clock
            </p>
          </div>
          <div className="font-['Space_Grotesk:Medium',_sans-serif] relative shrink-0">
            <p className="block leading-[normal] text-nowrap whitespace-pre">
              R$ 20,00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="basis-0 bg-[#f8f8f9] grow h-full min-h-px min-w-px relative rounded-2xl shrink-0">
      <div className="absolute border border-[#f3f3f4] border-solid inset-0 pointer-events-none rounded-2xl" />
      <div className="flex flex-col items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-col gap-2 items-center justify-center p-[16px] relative size-full">
          <Frame9 />
          <Frame10 />
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="absolute h-[122px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[436px]">
      <div className="box-border content-stretch flex flex-row gap-[15px] h-[122px] items-center justify-start p-0 relative w-[436px]">
        <Frame1 />
        <Frame4 />
        <Frame2 />
      </div>
    </div>
  );
}

export default function Rodape() {
  return (
    <div className="bg-[#ffffff] relative size-full" data-name="rodape">
      <Frame11 />
    </div>
  );
}